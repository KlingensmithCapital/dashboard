import React, { useState } from "react"

export default function FinancialDashboard() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)

  const portfolio = [
    { symbol: "SPY", price: "$582.43", change: "+1.2%", value: "$245,000" },
    { symbol: "QQQ", price: "$492.15", change: "+2.1%", value: "$180,000" },
    { symbol: "PLTR", price: "$28.76", change: "+3.4%", value: "$95,000" },
    { symbol: "TSLA", price: "$248.92", change: "-0.8%", value: "$120,000" },
  ]

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ 
          background: "rgba(255,255,255,0.1)", 
          padding: "3rem", 
          borderRadius: "20px", 
          backdropFilter: "blur(20px)", 
          minWidth: "400px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
        }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", textAlign: "center", color: "white" }}>
            Financial Dashboard
          </h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              display: "block", width: "100%", padding: "1.2rem", 
              marginBottom: "1.5rem", borderRadius: "12px", 
              border: "none", fontSize: "1.1rem", background: "rgba(255,255,255,0.9)"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              display: "block", width: "100%", padding: "1.2rem", 
              marginBottom: "2rem", borderRadius: "12px", 
              border: "none", fontSize: "1.1rem", background: "rgba(255,255,255,0.9)"
            }}
          />
          <button
            onClick={() => { if (email && password) setLoggedIn(true) }}
            style={{ 
              width: "100%", padding: "1.2rem", background: "#10b981", 
              color: "white", border: "none", borderRadius: "12px", 
              fontSize: "1.2rem", cursor: "pointer", fontWeight: "600"
            }}
          >
            Secure Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ 
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%)", 
        color: "white", padding: "1.5rem 2rem", 
        boxShadow: "0 4px 20px rgba(30,58,138,0.3)" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700" }}>
            Financial Dashboard
          </h1>
          <button 
            onClick={() => setLoggedIn(false)} 
            style={{ 
              background: "#ef4444", color: "white", border: "none", 
              padding: "0.75rem 1.5rem", borderRadius: "8px", 
              cursor: "pointer", fontWeight: "500"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          <div style={{ 
            background: "white", padding: "2.5rem", borderRadius: "16px", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <h2 style={{ color: "#1e293b", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>
              Portfolio Value
            </h2>
            <div style={{ fontSize: "3.5rem", fontWeight: "800", color: "#059669" }}>
              $1,247,500
            </div>
            <div style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "1.1rem" }}>
              +3.2% this month
            </div>
          </div>
          <div style={{ 
            background: "white", padding: "2.5rem", borderRadius: "16px", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <h2 style={{ color: "#1e293b", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>
              Trade Alerts
            </h2>
            <div style={{ fontSize: "3rem", color: "#f59e0b", fontWeight: "700" }}>
              5
            </div>
            <div style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              New opportunities
            </div>
          </div>
          <div style={{ 
            background: "white", padding: "2.5rem", borderRadius: "16px", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <h2 style={{ color: "#1e293b", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>
              Win Rate
            </h2>
            <div style={{ fontSize: "3rem", color: "#10b981", fontWeight: "700" }}>
              78.4%
            </div>
            <div style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              Last 30 trades
            </div>
          </div>
        </div>

        <div style={{ 
          background: "white", padding: "2.5rem", borderRadius: "16px", 
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0"
        }}>
          <h2 style={{ color: "#1e293b", marginBottom: "2rem", fontSize: "1.5rem", fontWeight: "700" }}>
            Portfolio Holdings
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Symbol</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Price</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb" }}>24h Î”</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Position Value</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb" }}>P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((holding, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1.25rem 1.5rem", fontWeight: "600", color: "#1e293b" }}>
                      <div>{holding.symbol}</div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>500 shares</div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right", color: "#374151", fontWeight: "500" }}>
                      {holding.price}
                    </td>
                    <td style={{ 
                      padding: "1.25rem 1.5rem", textAlign: "right", 
                      color: holding.change.startsWith("+") ? "#059669" : "#dc2626",
                      fontWeight: "600"
                    }}>
                      {holding.change}
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontWeight: "600", color: "#1e293b" }}>
                      {holding.value}
                    </td>
                    <td style={{ 
                      padding: "1.25rem 1.5rem", textAlign: "right", 
                      color: "#059669", fontWeight: "700", fontSize: "1.05rem"
                    }}>
                      +$8,450
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}