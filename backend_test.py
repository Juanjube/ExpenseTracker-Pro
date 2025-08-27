#!/usr/bin/env python3
"""
Backend API Tests for Financial Management Application
Tests all backend endpoints for Colombian expense/income management system
"""

import requests
import json
from datetime import datetime, timezone
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"Testing backend API at: {API_URL}")

class FinancialAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                data = response.json()
                expected_message = "API de Gestión Financiera - Colombia"
                if data.get("message") == expected_message:
                    self.log_test("API Root Endpoint", True, f"Response: {data}")
                    return True
                else:
                    self.log_test("API Root Endpoint", False, f"Unexpected message: {data}")
                    return False
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")
            return False
    
    def test_create_income_transaction(self):
        """Test creating income transaction - $500,000 COP salary"""
        try:
            transaction_data = {
                "tipo": "ingreso",
                "monto": 500000,
                "categoria": "salario",
                "descripcion": "Salario mensual enero 2025"
            }
            
            response = self.session.post(
                f"{API_URL}/transactions",
                json=transaction_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Verify response structure
                required_fields = ['id', 'tipo', 'monto', 'categoria', 'fecha']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    if (data['tipo'] == 'ingreso' and 
                        data['monto'] == 500000 and 
                        data['categoria'] == 'salario'):
                        self.log_test("Create Income Transaction", True, 
                                    f"Created transaction ID: {data['id']}, Amount: ${data['monto']:,} COP")
                        return True, data
                    else:
                        self.log_test("Create Income Transaction", False, 
                                    f"Data mismatch: {data}")
                        return False, None
                else:
                    self.log_test("Create Income Transaction", False, 
                                f"Missing fields: {missing_fields}")
                    return False, None
            else:
                self.log_test("Create Income Transaction", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Create Income Transaction", False, f"Exception: {str(e)}")
            return False, None
    
    def test_create_expense_transaction(self):
        """Test creating expense transaction - $150,000 COP food"""
        try:
            transaction_data = {
                "tipo": "gasto",
                "monto": 150000,
                "categoria": "alimentacion",
                "descripcion": "Compras supermercado enero 2025"
            }
            
            response = self.session.post(
                f"{API_URL}/transactions",
                json=transaction_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Verify response structure
                required_fields = ['id', 'tipo', 'monto', 'categoria', 'fecha']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    if (data['tipo'] == 'gasto' and 
                        data['monto'] == 150000 and 
                        data['categoria'] == 'alimentacion'):
                        self.log_test("Create Expense Transaction", True, 
                                    f"Created transaction ID: {data['id']}, Amount: ${data['monto']:,} COP")
                        return True, data
                    else:
                        self.log_test("Create Expense Transaction", False, 
                                    f"Data mismatch: {data}")
                        return False, None
                else:
                    self.log_test("Create Expense Transaction", False, 
                                f"Missing fields: {missing_fields}")
                    return False, None
            else:
                self.log_test("Create Expense Transaction", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Create Expense Transaction", False, f"Exception: {str(e)}")
            return False, None
    
    def test_get_all_transactions(self):
        """Test getting all transactions"""
        try:
            response = self.session.get(f"{API_URL}/transactions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    transaction_count = len(data)
                    if transaction_count >= 2:  # Should have at least our 2 test transactions
                        # Verify structure of transactions
                        sample_transaction = data[0] if data else {}
                        required_fields = ['id', 'tipo', 'monto', 'categoria', 'fecha']
                        missing_fields = [field for field in required_fields if field not in sample_transaction]
                        
                        if not missing_fields:
                            # Check for our test transactions
                            income_found = any(t['tipo'] == 'ingreso' and t['monto'] == 500000 for t in data)
                            expense_found = any(t['tipo'] == 'gasto' and t['monto'] == 150000 for t in data)
                            
                            self.log_test("Get All Transactions", True, 
                                        f"Retrieved {transaction_count} transactions. Income found: {income_found}, Expense found: {expense_found}")
                            return True, data
                        else:
                            self.log_test("Get All Transactions", False, 
                                        f"Missing fields in transaction: {missing_fields}")
                            return False, None
                    else:
                        self.log_test("Get All Transactions", True, 
                                    f"Retrieved {transaction_count} transactions (less than expected)")
                        return True, data
                else:
                    self.log_test("Get All Transactions", False, 
                                f"Expected list, got: {type(data)}")
                    return False, None
            else:
                self.log_test("Get All Transactions", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Get All Transactions", False, f"Exception: {str(e)}")
            return False, None
    
    def test_monthly_stats(self):
        """Test monthly dashboard statistics"""
        try:
            response = self.session.get(f"{API_URL}/dashboard/stats/mensual")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total_ingresos', 'total_gastos', 'balance', 'periodo']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    total_ingresos = data['total_ingresos']
                    total_gastos = data['total_gastos']
                    balance = data['balance']
                    periodo = data['periodo']
                    
                    # Verify calculations
                    expected_balance = total_ingresos - total_gastos
                    balance_correct = abs(balance - expected_balance) < 0.01
                    
                    if balance_correct and periodo == 'mensual':
                        # Check if we have positive balance (should be 500000 - 150000 = 350000)
                        balance_positive = balance > 0
                        self.log_test("Monthly Dashboard Stats", True, 
                                    f"Ingresos: ${total_ingresos:,.0f}, Gastos: ${total_gastos:,.0f}, Balance: ${balance:,.0f} (Positive: {balance_positive})")
                        return True, data
                    else:
                        self.log_test("Monthly Dashboard Stats", False, 
                                    f"Balance calculation error or wrong period. Expected balance: {expected_balance}, Got: {balance}")
                        return False, None
                else:
                    self.log_test("Monthly Dashboard Stats", False, 
                                f"Missing fields: {missing_fields}")
                    return False, None
            else:
                self.log_test("Monthly Dashboard Stats", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Monthly Dashboard Stats", False, f"Exception: {str(e)}")
            return False, None
    
    def test_monthly_chart_data(self):
        """Test monthly chart data"""
        try:
            response = self.session.get(f"{API_URL}/dashboard/chart-data/mensual")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['labels', 'ingresos', 'gastos']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    labels = data['labels']
                    ingresos = data['ingresos']
                    gastos = data['gastos']
                    
                    # Verify structure
                    if (isinstance(labels, list) and 
                        isinstance(ingresos, list) and 
                        isinstance(gastos, list) and
                        len(labels) == len(ingresos) == len(gastos)):
                        
                        # Should have 6 months of data
                        expected_months = 6
                        if len(labels) == expected_months:
                            # Check if we have some data (at least one non-zero value)
                            has_income_data = any(val > 0 for val in ingresos)
                            has_expense_data = any(val > 0 for val in gastos)
                            
                            self.log_test("Monthly Chart Data", True, 
                                        f"Retrieved {len(labels)} months of data. Has income data: {has_income_data}, Has expense data: {has_expense_data}")
                            return True, data
                        else:
                            self.log_test("Monthly Chart Data", False, 
                                        f"Expected {expected_months} months, got {len(labels)}")
                            return False, None
                    else:
                        self.log_test("Monthly Chart Data", False, 
                                    f"Array length mismatch: labels={len(labels)}, ingresos={len(ingresos)}, gastos={len(gastos)}")
                        return False, None
                else:
                    self.log_test("Monthly Chart Data", False, 
                                f"Missing fields: {missing_fields}")
                    return False, None
            else:
                self.log_test("Monthly Chart Data", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Monthly Chart Data", False, f"Exception: {str(e)}")
            return False, None
    
    def test_other_periods(self):
        """Test daily and weekly periods"""
        periods = ['diario', 'semanal']
        success_count = 0
        
        for periodo in periods:
            try:
                # Test stats endpoint
                stats_response = self.session.get(f"{API_URL}/dashboard/stats/{periodo}")
                chart_response = self.session.get(f"{API_URL}/dashboard/chart-data/{periodo}")
                
                stats_ok = stats_response.status_code == 200
                chart_ok = chart_response.status_code == 200
                
                if stats_ok and chart_ok:
                    stats_data = stats_response.json()
                    chart_data = chart_response.json()
                    
                    # Basic validation
                    stats_valid = all(field in stats_data for field in ['total_ingresos', 'total_gastos', 'balance', 'periodo'])
                    chart_valid = all(field in chart_data for field in ['labels', 'ingresos', 'gastos'])
                    
                    if stats_valid and chart_valid:
                        success_count += 1
                        self.log_test(f"Period {periodo.title()} APIs", True, 
                                    f"Stats and chart data retrieved successfully")
                    else:
                        self.log_test(f"Period {periodo.title()} APIs", False, 
                                    f"Invalid response structure")
                else:
                    self.log_test(f"Period {periodo.title()} APIs", False, 
                                f"Stats status: {stats_response.status_code}, Chart status: {chart_response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Period {periodo.title()} APIs", False, f"Exception: {str(e)}")
        
        return success_count == len(periods)
    
    def test_invalid_period(self):
        """Test invalid period handling"""
        try:
            response = self.session.get(f"{API_URL}/dashboard/stats/invalid_period")
            
            if response.status_code == 400:
                data = response.json()
                if 'detail' in data and 'no válido' in data['detail'].lower():
                    self.log_test("Invalid Period Handling", True, 
                                f"Correctly rejected invalid period with 400 status")
                    return True
                else:
                    self.log_test("Invalid Period Handling", False, 
                                f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Invalid Period Handling", False, 
                            f"Expected 400 status, got: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Period Handling", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("BACKEND API TESTING - FINANCIAL MANAGEMENT SYSTEM")
        print("=" * 60)
        print()
        
        # Test sequence
        tests = [
            self.test_api_root,
            self.test_create_income_transaction,
            self.test_create_expense_transaction,
            self.test_get_all_transactions,
            self.test_monthly_stats,
            self.test_monthly_chart_data,
            self.test_other_periods,
            self.test_invalid_period
        ]
        
        for test in tests:
            test()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Failed tests details
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("FAILED TESTS:")
            for test in failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        return passed == total

if __name__ == "__main__":
    tester = FinancialAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)