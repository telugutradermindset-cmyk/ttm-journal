"""
MT5 Bridge Server - Multi Account Support
Telugu Trader Mindset

HOW TO ADD YOUR ACCOUNTS:
Edit mt5_accounts.json (created after first run) OR edit ACCOUNTS list below.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import MetaTrader5 as mt5
from datetime import datetime, timedelta
import sys
import json
import os

app = Flask(__name__)
CORS(app)

# ===================== YOUR ACCOUNTS =====================
# Fill in your details. "name" is just a label shown in the app.
ACCOUNTS = [
    {"name": "Account 1", "login": 0, "password": "", "server": ""},
    {"name": "Account 2", "login": 0, "password": "", "server": ""},
    {"name": "Account 3", "login": 0, "password": "", "server": ""},
    {"name": "Account 4", "login": 0, "password": "", "server": ""},
    {"name": "Account 5", "login": 0, "password": "", "server": ""},
]
# =========================================================

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mt5_accounts.json')
active_account_index = 0

def load_accounts_config():
    global ACCOUNTS
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                ACCOUNTS = json.load(f)
                print(f"Loaded {len(ACCOUNTS)} accounts from mt5_accounts.json")
        except:
            pass

def save_accounts_config():
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(ACCOUNTS, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save config: {e}")

def connect_account(index):
    global active_account_index
    if index < 0 or index >= len(ACCOUNTS):
        return False, "Invalid account index"
    acc = ACCOUNTS[index]
    if not acc.get('login') or acc['login'] == 0:
        return False, f"{acc['name']} is not configured yet. Add login/password/server in the app."
    mt5.shutdown()
    if not mt5.initialize():
        return False, f"MT5 init failed: {mt5.last_error()}"
    if acc.get('password') and acc.get('server'):
        if not mt5.login(acc['login'], password=acc['password'], server=acc['server']):
            return False, f"Login failed: {mt5.last_error()}"
    info = mt5.account_info()
    if info is None:
        return False, "Could not get account info after login"
    active_account_index = index
    print(f"Switched to: {acc['name']} #{info.login} | Balance: {info.balance} {info.currency}")
    return True, "Connected"

def init_mt5():
    global active_account_index
    load_accounts_config()
    if not mt5.initialize():
        print(f"MT5 init failed: {mt5.last_error()}")
        return False
    info = mt5.account_info()
    if info:
        print(f"MT5 connected! Account: #{info.login} | {info.server} | Balance: {info.balance} {info.currency}")
        for i, acc in enumerate(ACCOUNTS):
            if acc.get('login') == info.login:
                active_account_index = i
                break
    return True

@app.route('/status')
def status():
    if mt5.terminal_info() is None:
        return jsonify({"connected": False, "error": "MT5 not running"})
    info = mt5.account_info()
    if info is None:
        return jsonify({"connected": False})
    return jsonify({"connected": True})

@app.route('/accounts')
def accounts():
    info = mt5.account_info()
    result = []
    for i, acc in enumerate(ACCOUNTS):
        result.append({
            "index": i,
            "name": acc.get("name", f"Account {i+1}"),
            "login": acc.get("login", 0),
            "server": acc.get("server", ""),
            "active": i == active_account_index,
            "configured": bool(acc.get("login") and acc["login"] != 0),
        })
    return jsonify(result)

@app.route('/switch-account/<int:index>', methods=['POST'])
def switch_account(index):
    success, message = connect_account(index)
    if success:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": message}), 400

@app.route('/save-accounts', methods=['POST'])
def save_accounts_route():
    global ACCOUNTS
    data = request.json
    if not data or not isinstance(data, list):
        return jsonify({"success": False, "error": "Invalid data"}), 400
    ACCOUNTS = data
    save_accounts_config()
    return jsonify({"success": True})

@app.route('/account')
def account():
    info = mt5.account_info()
    if info is None:
        return jsonify({"error": "Could not fetch account info"}), 500
    acc_name = ACCOUNTS[active_account_index].get('name', f'Account {active_account_index+1}') if active_account_index < len(ACCOUNTS) else 'Unknown'
    return jsonify({
        "login": info.login, "server": info.server, "name": acc_name,
        "balance": round(info.balance, 2), "equity": round(info.equity, 2),
        "margin": round(info.margin, 2), "freeMargin": round(info.margin_free, 2),
        "marginLevel": round(info.margin_level, 2) if info.margin_level else 0,
        "profit": round(info.profit, 2), "currency": info.currency,
        "leverage": info.leverage,
        "accountType": "Demo" if info.trade_mode == 0 else "Live",
    })

@app.route('/open-trades')
def open_trades():
    positions = mt5.positions_get()
    if positions is None:
        return jsonify([])
    return jsonify([{
        "ticket": p.ticket, "symbol": p.symbol,
        "type": "Buy" if p.type == 0 else "Sell",
        "volume": p.volume, "openPrice": p.price_open,
        "currentPrice": p.price_current, "sl": p.sl, "tp": p.tp,
        "profit": round(p.profit, 2), "swap": round(p.swap, 2),
        "openTime": datetime.fromtimestamp(p.time).strftime("%Y-%m-%d %H:%M"),
        "comment": p.comment,
    } for p in positions])

@app.route('/history/<int:days>')
def history(days):
    deals = mt5.history_deals_get(datetime.now() - timedelta(days=days), datetime.now())
    if deals is None:
        return jsonify([])
    return jsonify([{
        "ticket": d.ticket, "symbol": d.symbol,
        "type": "Buy" if d.type == 0 else "Sell",
        "entry": "In" if d.entry == 0 else "Out",
        "volume": d.volume, "price": d.price,
        "profit": round(d.profit, 2), "swap": round(d.swap, 2),
        "commission": round(d.commission, 2),
        "time": datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M"),
    } for d in deals if d.type in [0, 1] and d.entry in [0, 1]])

@app.route('/summary')
def summary():
    deals = mt5.history_deals_get(datetime.now() - timedelta(days=30), datetime.now())
    if deals is None:
        return jsonify({"error": "Could not fetch history"}), 500
    total_profit, wins, losses, total_trades = 0, 0, 0, 0
    for d in deals:
        if d.type in [0, 1] and d.entry == 1:
            total_trades += 1
            total_profit += d.profit
            if d.profit > 0: wins += 1
            elif d.profit < 0: losses += 1
    return jsonify({
        "totalTrades": total_trades, "wins": wins, "losses": losses,
        "winRate": round((wins / total_trades * 100), 1) if total_trades > 0 else 0,
        "totalProfit": round(total_profit, 2), "period": "Last 30 Days"
    })

if __name__ == '__main__':
    print("\n========================================")
    print("  MT5 Bridge Server — Multi Account")
    print("  Telugu Trader Mindset")
    print("========================================\n")
    if not init_mt5():
        input("MT5 not found. Open MetaTrader5, log in, then press Enter...")
        sys.exit(1)
    print("\nConfigured accounts:")
    for i, acc in enumerate(ACCOUNTS):
        ok = "OK" if acc.get('login') and acc['login'] != 0 else "not configured"
        print(f"  {i+1}. {acc['name']} #{acc.get('login','—')} [{ok}]")
    print("\nBridge running on http://localhost:5000")
    print("Keep this window open while using the app.\n")
    app.run(host='127.0.0.1', port=5000, debug=False)
