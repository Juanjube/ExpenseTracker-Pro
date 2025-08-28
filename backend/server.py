from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
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
    EFECTIVO_CONTADO = "efectivo_contado"
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

class CashCount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    billetes_100000: int = 0
    billetes_50000: int = 0
    billetes_20000: int = 0
    billetes_10000: int = 0
    billetes_5000: int = 0
    billetes_2000: int = 0
    monedas_1000: int = 0
    monedas_500: int = 0
    monedas_200: int = 0
    monedas_100: int = 0
    monedas_50: int = 0
    total_calculado: float
    descripcion: Optional[str] = None
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CashCountCreate(BaseModel):
    billetes_100000: int = 0
    billetes_50000: int = 0
    billetes_20000: int = 0
    billetes_10000: int = 0
    billetes_5000: int = 0
    billetes_2000: int = 0
    monedas_1000: int = 0
    monedas_500: int = 0
    monedas_200: int = 0
    monedas_100: int = 0
    monedas_50: int = 0
    descripcion: Optional[str] = None

class DashboardStats(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    periodo: str

class CategoryStats(BaseModel):
    categoria: str
    total: float
    porcentaje: float

class DetailedReport(BaseModel):
    stats: DashboardStats
    ingresos_por_categoria: List[CategoryStats]
    gastos_por_categoria: List[CategoryStats]
    transacciones_recientes: List[Transaction]
    periodo: str
    fecha_generacion: datetime

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data.get('fecha'), datetime):
        data['fecha'] = data['fecha'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('fecha'), str):
        item['fecha'] = datetime.fromisoformat(item['fecha'])
    return item

def calculate_cash_total(cash_data: CashCountCreate) -> float:
    """Calcular el total del conteo de efectivo"""
    total = 0
    # Billetes
    total += cash_data.billetes_100000 * 100000
    total += cash_data.billetes_50000 * 50000
    total += cash_data.billetes_20000 * 20000
    total += cash_data.billetes_10000 * 10000
    total += cash_data.billetes_5000 * 5000
    total += cash_data.billetes_2000 * 2000
    # Monedas
    total += cash_data.monedas_1000 * 1000
    total += cash_data.monedas_500 * 500
    total += cash_data.monedas_200 * 200
    total += cash_data.monedas_100 * 100
    total += cash_data.monedas_50 * 50
    return total

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
async def get_transactions(limit: int = 100):
    transactions = await db.transactions.find().sort("fecha", -1).to_list(limit)
    parsed_transactions = [parse_from_mongo(t) for t in transactions]
    return [Transaction(**t) for t in parsed_transactions]

@api_router.post("/cash-count", response_model=CashCount)
async def create_cash_count(input: CashCountCreate):
    total = calculate_cash_total(input)
    cash_dict = input.dict()
    cash_dict['total_calculado'] = total
    cash_obj = CashCount(**cash_dict)
    cash_data = prepare_for_mongo(cash_obj.dict())
    await db.cash_counts.insert_one(cash_data)
    
    # Agregar automáticamente como transacción de ingreso
    if total > 0:
        transaction_data = {
            "tipo": "ingreso",
            "monto": total,
            "categoria": "efectivo_contado",
            "descripcion": f"Conteo de efectivo - {cash_obj.descripcion or 'Sin descripción'}"
        }
        transaction_obj = Transaction(**transaction_data)
        transaction_mongo = prepare_for_mongo(transaction_obj.dict())
        await db.transactions.insert_one(transaction_mongo)
    
    return cash_obj

@api_router.get("/cash-count", response_model=List[CashCount])
async def get_cash_counts():
    cash_counts = await db.cash_counts.find().sort("fecha", -1).to_list(50)
    parsed_counts = [parse_from_mongo(c) for c in cash_counts]
    return [CashCount(**c) for c in parsed_counts]

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
    elif periodo == "anual":
        start_date = now - timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Período no válido. Use: diario, semanal, mensual, anual")
    
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

@api_router.get("/dashboard/category-stats/{periodo}")
async def get_category_stats(periodo: str, tipo: str = "gasto"):
    """Obtener estadísticas por categoría"""
    now = datetime.now(timezone.utc)
    
    if periodo == "diario":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif periodo == "semanal":
        start_date = now - timedelta(days=7)
    elif periodo == "mensual":
        start_date = now - timedelta(days=30)
    else:
        raise HTTPException(status_code=400, detail="Período no válido")
    
    transactions = await db.transactions.find({
        "fecha": {"$gte": start_date.isoformat()},
        "tipo": tipo
    }).to_list(1000)
    
    # Agrupar por categoría
    category_totals = {}
    total_general = 0
    
    for t in transactions:
        categoria = t["categoria"]
        monto = t["monto"]
        category_totals[categoria] = category_totals.get(categoria, 0) + monto
        total_general += monto
    
    # Calcular porcentajes
    category_stats = []
    for categoria, total in category_totals.items():
        porcentaje = (total / total_general * 100) if total_general > 0 else 0
        category_stats.append(CategoryStats(
            categoria=categoria,
            total=total,
            porcentaje=porcentaje
        ))
    
    # Ordenar por monto descendente
    category_stats.sort(key=lambda x: x.total, reverse=True)
    
    return category_stats

@api_router.get("/reports/detailed/{periodo}", response_model=DetailedReport)
async def get_detailed_report(periodo: str):
    """Generar reporte detallado para impresión"""
    # Obtener estadísticas generales
    stats_response = await get_dashboard_stats(periodo)
    
    # Obtener estadísticas por categoría
    ingresos_categorias = await get_category_stats(periodo, "ingreso")
    gastos_categorias = await get_category_stats(periodo, "gasto")
    
    # Obtener transacciones recientes (últimas 20)
    recent_transactions = await get_transactions(20)
    
    return DetailedReport(
        stats=stats_response,
        ingresos_por_categoria=ingresos_categorias,
        gastos_por_categoria=gastos_categorias,
        transacciones_recientes=recent_transactions,
        periodo=periodo,
        fecha_generacion=datetime.now(timezone.utc)
    )

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