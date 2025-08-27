from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TransactionType(str, Enum):
    INGRESO = "ingreso"
    GASTO = "gasto"

class TransactionCategory(str, Enum):
    # Categorías de ingresos
    SALARIO = "salario"
    FREELANCE = "freelance"
    VENTAS = "ventas"
    INVERSIONES = "inversiones"
    OTROS_INGRESOS = "otros_ingresos"
    
    # Categorías de gastos
    ALIMENTACION = "alimentacion"
    TRANSPORTE = "transporte"
    VIVIENDA = "vivienda"
    ENTRETENIMIENTO = "entretenimiento"
    SALUD = "salud"
    EDUCACION = "educacion"
    COMPRAS = "compras"
    SERVICIOS = "servicios"
    OTROS_GASTOS = "otros_gastos"

# Models
class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: TransactionType
    monto: float
    categoria: TransactionCategory
    descripcion: Optional[str] = None
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    tipo: TransactionType
    monto: float
    categoria: TransactionCategory
    descripcion: Optional[str] = None

class DashboardStats(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    periodo: str

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data.get('fecha'), datetime):
        data['fecha'] = data['fecha'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('fecha'), str):
        item['fecha'] = datetime.fromisoformat(item['fecha'])
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "API de Gestión Financiera - Colombia"}

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    transaction_dict = input.dict()
    transaction_obj = Transaction(**transaction_dict)
    transaction_data = prepare_for_mongo(transaction_obj.dict())
    await db.transactions.insert_one(transaction_data)
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    transactions = await db.transactions.find().to_list(1000)
    parsed_transactions = [parse_from_mongo(t) for t in transactions]
    return [Transaction(**t) for t in parsed_transactions]

@api_router.get("/dashboard/stats/{periodo}")
async def get_dashboard_stats(periodo: str):
    # Calcular fechas según el período
    now = datetime.now(timezone.utc)
    
    if periodo == "diario":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif periodo == "semanal":
        start_date = now - timedelta(days=7)
    elif periodo == "mensual":
        start_date = now - timedelta(days=30)
    else:
        raise HTTPException(status_code=400, detail="Período no válido. Use: diario, semanal, mensual")
    
    # Buscar transacciones en el período
    transactions = await db.transactions.find({
        "fecha": {"$gte": start_date.isoformat()}
    }).to_list(1000)
    
    # Calcular estadísticas
    total_ingresos = sum(t["monto"] for t in transactions if t["tipo"] == "ingreso")
    total_gastos = sum(t["monto"] for t in transactions if t["tipo"] == "gasto")
    balance = total_ingresos - total_gastos
    
    return DashboardStats(
        total_ingresos=total_ingresos,
        total_gastos=total_gastos,
        balance=balance,
        periodo=periodo
    )

@api_router.get("/dashboard/chart-data/{periodo}")
async def get_chart_data(periodo: str):
    now = datetime.now(timezone.utc)
    
    if periodo == "diario":
        # Últimos 7 días
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
        labels = [(now - timedelta(days=i)).strftime("%d/%m") for i in range(6, -1, -1)]
    elif periodo == "semanal":
        # Últimas 4 semanas
        dates = []
        labels = []
        for i in range(3, -1, -1):
            week_start = now - timedelta(weeks=i)
            dates.append(week_start.strftime("%Y-%m-%d"))
            labels.append(f"Sem {week_start.strftime('%d/%m')}")
    elif periodo == "mensual":
        # Últimos 6 meses
        dates = []
        labels = []
        for i in range(5, -1, -1):
            month_start = now - timedelta(days=30*i)
            dates.append(month_start.strftime("%Y-%m"))
            labels.append(month_start.strftime("%m/%Y"))
    else:
        raise HTTPException(status_code=400, detail="Período no válido")
    
    # Obtener transacciones
    all_transactions = await db.transactions.find().to_list(1000)
    
    # Procesar datos para gráficas
    ingresos_data = []
    gastos_data = []
    
    for date_str in dates:
        day_ingresos = 0
        day_gastos = 0
        
        for t in all_transactions:
            t_date = datetime.fromisoformat(t["fecha"]) if isinstance(t["fecha"], str) else t["fecha"]
            
            if periodo == "diario":
                if t_date.strftime("%Y-%m-%d") == date_str:
                    if t["tipo"] == "ingreso":
                        day_ingresos += t["monto"]
                    else:
                        day_gastos += t["monto"]
            elif periodo == "semanal":
                week_start = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                week_end = week_start + timedelta(days=7)
                if week_start <= t_date < week_end:
                    if t["tipo"] == "ingreso":
                        day_ingresos += t["monto"]
                    else:
                        day_gastos += t["monto"]
            elif periodo == "mensual":
                if t_date.strftime("%Y-%m") == date_str:
                    if t["tipo"] == "ingreso":
                        day_ingresos += t["monto"]
                    else:
                        day_gastos += t["monto"]
        
        ingresos_data.append(day_ingresos)
        gastos_data.append(day_gastos)
    
    return {
        "labels": labels,
        "ingresos": ingresos_data,
        "gastos": gastos_data
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()