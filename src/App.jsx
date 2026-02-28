import { useState, useEffect } from 'react'
import './App.css'

// Google Sheet CSV URL (public access)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/export?format=csv&gid=0'

// Login credentials
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin123'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  // Check login status on mount
  useEffect(() => {
    const session = sessionStorage.getItem('yoyaku_session')
    if (session) {
      setIsLoggedIn(true)
      fetchData()
    }
  }, [])

  // Fetch data from Google Sheets
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(SHEET_CSV_URL)
      const text = await response.text()
      parseCSV(text)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('データ取得に失敗しました。もう一度お試しください。')
    }
    setLoading(false)
  }

  // Parse CSV to JSON
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    setColumns(headers)

    const records = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length >= headers.length) {
        const record = {}
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim().replace(/"/g, '') || ''
        })
        records.push(record)
      }
    }
    setData(records)
    setCurrentPage(1)
  }

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault()
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem('yoyaku_session', new Date().toISOString())
      setIsLoggedIn(true)
      setUsername('')
      setPassword('')
      setLoginError('')
      fetchData()
    } else {
      setLoginError('ユーザー名またはパスワードが正しくありません')
    }
  }

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('yoyaku_session')
    setIsLoggedIn(false)
    setData([])
    setColumns([])
  }

  // Filter and paginate data
  const getFilteredData = () => {
    if (!filterText) return data
    return data.filter(item => 
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    )
  }

  const filteredData = getFilteredData()
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // If not logged in, show login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="login-card bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">🔐 ログイン</h1>
          <p className="text-gray-500 text-sm text-center mb-6">予約管理システム</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="admin"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Main content after login
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">📋 予約一覧</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="検索（予約者、ホテル名など）..."
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            {/* Refresh button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新
            </button>
          </div>
          
          {/* Stats */}
          <div className="text-sm text-gray-600">
            合計 {filteredData.length} 件表示中 | ページ {currentPage} / {totalPages || 1}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">データ読み込み中...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">データが見つかりません</p>
          </div>
        ) : (
          <>
            <div className="table-container bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {columns.slice(0, 10).map((col, idx) => (
                      <th key={idx} className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition">
                      {columns.slice(0, 10).map((col, colIndex) => (
                        <td key={colIndex} className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 前へ
                </button>
                
                <span className="text-sm text-gray-600">
                  {((currentPage - 1) * rowsPerPage + 1)} - {Math.min(currentPage * rowsPerPage, filteredData.length)} / {filteredData.length}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 py-6 text-center text-sm text-gray-500">
        <p>© 2026 予約管理システム | Powered by Cloudflare Pages</p>
      </footer>
    </div>
  )
}

export default App
