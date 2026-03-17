import { useState, useEffect } from 'react'
import './App.css'

// Encrypted credentials (Base64 for demo - in production use proper encryption)
const decodeEnv = (str) => atob(str).split('').reverse().join('')

const ADMIN_USER = decodeEnv('NjIwMnVrYXlveQ==') // yoyaku2026
const ADMIN_PASS = decodeEnv('NDMyMXVrYXlveQ==') // yoyaku1234
const SHEET_ID = decodeEnv('OHhEdFp1R3IzY09ZODBBWFJCc09lY3FOYmZZNmFsRXV6OWE5ZkNZVmVnbTE=') // Correct Sheet ID
const API_KEY = decodeEnv('NDRuVFhfM1JhMXZ2QmowWU9wUWlfaXRqOXVfSWlqTC1BeVNheklB') // Encrypted Google Sheets API Key

// Extract real URL from Google redirect
const extractRealUrl = (url) => {
    if (!url || typeof url !== 'string') return null
    try {
        if (!url.includes('google.com/url')) return url
        const u = new URL(url)
        const q = u.searchParams.get('q')
        return q ? decodeURIComponent(q) : url
    } catch (e) {
        console.error('URL parse error:', e)
        return url
    }
}

// Extract URL from HYPERLINK formula string
const extractUrlFromFormula = (formula) => {
    if (!formula || typeof formula !== 'string') return null
    const match = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i)
    return match ? match[1] : null
}

function App() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [apiStatus, setApiStatus] = useState('Initializing...')
    
    const [filterStatus, setFilterStatus] = useState(['利用者登録済', '申込済'])
    const [filterHotel, setFilterHotel] = useState('')
    const [filterText, setFilterText] = useState('')
    const [hidePastDates, setHidePastDates] = useState(true) // 默认隐藏过去数据
    
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    useEffect(() => {
        const session = sessionStorage.getItem('yoyaku_session')
        if (session) {
            const diffHours = (Date.now() - new Date(session).getTime()) / 36e5
            if (diffHours < 24) {
                setIsLoggedIn(true)
                fetchData()
            } else {
                sessionStorage.removeItem('yoyaku_session')
            }
        }
    }, [])

    const parseCSVLine = (line) => {
        const result = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const nextChar = line[i + 1]
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current)
                current = ''
            } else {
                current += char
            }
        }
        result.push(current)
        return result.map(v => v.trim())
    }

    const fetchData = async () => {
        setLoading(true)
        
        try {
            setApiStatus('Connecting to Sheets API v4 (spreadsheets.get)...')
            console.log('🔄 Fetching via spreadsheets.get with includeGridData...')
            
            // Use spreadsheets.get endpoint to access hyperlink field
            const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?includeGridData=true&key=${API_KEY}`
            
            console.log('🔑 SHEET_ID:', SHEET_ID)
            console.log('🔑 API_KEY length:', API_KEY.length, 'starts with:', API_KEY.substring(0, 10))
            console.log('🌐 API URL (masked):', apiUrl.replace(API_KEY, '[HIDDEN]'))
            
            const apiResponse = await fetch(apiUrl)
            
            if (!apiResponse.ok) {
                const errorText = await apiResponse.text()
                console.error('API Error:', apiResponse.status, errorText)
                throw new Error(`Sheets API Error: ${apiResponse.status}`)
            }
            
            const sheetData = await apiResponse.json()
            
            // Navigate the response structure
            const sheets = sheetData.sheets || []
            if (sheets.length === 0) throw new Error('No sheets found')
            
            const rowData = sheets[0].data?.[0]?.rowData || []
            if (rowData.length === 0) throw new Error('No data found in sheet')
            
            // Skip header row (index 0), start from index 1
            const dataRows = rowData.slice(1)
            console.log(`✅ API returned ${dataRows.length} data rows`)
            
            // Build records from API response
            const records = dataRows.map((rowObj, rowIndex) => {
                const cells = rowObj.values || []
                const record = { _id: rowIndex + 2 }
                
                // Helper to get cell value safely
                const getCellValue = (idx, fallback = '') => {
                    if (idx >= cells.length) return fallback
                    const cell = cells[idx]
                    // Check for numberValue first (for dates stored as numbers in Sheets)
                    if (cell?.effectiveValue?.numberValue !== undefined) {
                        return cell.effectiveValue.numberValue.toString()
                    }
                    return cell?.effectiveValue?.stringValue || 
                           fallback
                }
                
                // Helper to get raw cell data (including type info)
                const getCellRaw = (idx) => {
                    if (idx >= cells.length) return null
                    return cells[idx]
                }
                
                // Helper to get hyperlink URL
                const getHyperlink = (idx, fallback = '') => {
                    if (idx >= cells.length) return fallback
                    return cells[idx]?.hyperlink || fallback
                }
                
                // Map basic fields - start with "更新日" from column A (index 0)
                const updateDateCell = getCellRaw(0)
                record['更新日'] = updateDateCell?.effectiveValue?.numberValue ?
                    excelSerialToDate(updateDateCell.effectiveValue.numberValue) :
                    ''
                
                record['受付番号'] = getCellValue(1)
                record['予約者'] = getCellValue(2)
                // For dates, store the full cell object so we can access both value and format later
                const stayDateCell = getCellRaw(3)
                const cancelDateCell = getCellRaw(6)
                
                // Convert Excel serial dates
                record['宿泊日'] = stayDateCell?.effectiveValue?.numberValue ? 
                    excelSerialToDate(stayDateCell.effectiveValue.numberValue) : 
                    ''
                record['ホテル'] = getCellValue(4)
                record['部屋タイプ'] = getCellValue(5)
                record['キャンセル料発生日'] = cancelDateCell?.effectiveValue?.numberValue ? 
                    excelSerialToDate(cancelDateCell.effectiveValue.numberValue) : 
                    ''
                record['状態'] = getCellValue(10)
                
                // Extract hyperlink URLs directly!
                record['詳細登録'] = getHyperlink(7)
                record['キャンセル'] = getHyperlink(8)
                record['利用案内書'] = getHyperlink(9)
                
                // Debug logging for first few rows
                if (rowIndex < 2) {
                    console.log(`Row ${rowIndex+2}:`, {
                        '宿泊日': record['宿泊日'],
                        'キャンセル料発生日': record['キャンセル料発生日']
                    })
                }
                
                return record
            })
            
            console.log(`✅ Processed ${records.length} records with extracted hyperlinks`)
            setApiStatus('✓ Using authenticated Sheets API (spreadsheets.get)')
            setData(records)
            setCurrentPage(1)
            
        } catch (error) {
            console.error('❌ Sheets API Error, trying CSV fallback...', error.message)
            setApiStatus('⚠️ Using CSV export (limited link support)')
            
            // Fallback to CSV export
            try {
                const csvRes = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`)
                const csvText = await csvRes.text()
                
                const lines = []
                let currentLine = ''
                let inQuotes = false
                
                for (let i = 0; i < csvText.length; i++) {
                    const char = csvText[i]
                    const nextChar = csvText[i + 1]
                    
                    if (char === '"') {
                        if (inQuotes && nextChar === '"') {
                            currentLine += '"'
                            i++
                        } else {
                            inQuotes = !inQuotes
                        }
                    } else if (char === '\n' && !inQuotes) {
                        lines.push(currentLine)
                        currentLine = ''
                    } else {
                        currentLine += char
                    }
                }
                if (currentLine.trim()) lines.push(currentLine)
                
                if (lines.length >= 2) {
                    const headers = parseCSVLine(lines[0]).map(h => h.trim())
                    const records = []
                    
                    for (let ri = 1; ri < lines.length; ri++) {
                        const cells = parseCSVLine(lines[ri])
                        const record = { _id: ri }
                        
                        headers.forEach((header, ci) => {
                            record[header] = cells[ci]?.trim() || ''
                        })
                        
                        records.push(record)
                    }
                    
                    console.log(`✅ Fallback: Loaded ${records.length} records via CSV`)
                    setData(records)
                }
            } catch (fallbackError) {
                console.error('❌ Both methods failed:', fallbackError)
                alert('データ取得失敗:\n' + error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    // Convert Excel serial date (days since 1899-12-30) to YYYY-MM-DD format
    const excelSerialToDate = (serial) => {
        if (!serial || isNaN(serial)) return ''
        try {
            // Excel dates start from 1899-12-30
            const baseDate = new Date(1899, 11, 30) // Month is 0-indexed
            const oneDayMs = 24 * 60 * 60 * 1000
            const date = new Date(baseDate.getTime() + serial * oneDayMs)
            
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        } catch (e) {
            console.error('Date conversion error:', e)
            return ''
        }
    }

    // Helper to format dates as yyyy 年 mm 月 dd 日
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        try {
            const date = new Date(dateStr)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}年${month}月${day}日`
        } catch (e) {
            return dateStr
        }
    }

    const isValidUrl = (value) => {
        return value && typeof value === 'string' && value.startsWith('http')
    }

    const renderCell = (value, columnName, row) => {
        // Format date columns: yyyy 年 mm 月 dd 日
        if (columnName === '宿泊日' || columnName === 'キャンセル料発生日' || columnName === '更新日') {
            return <span>{formatDate(value)}</span>
        }

        const linkColumns = ['詳細登録', 'キャンセル', '利用案内書']
        
        if (linkColumns.includes(columnName)) {
            const url = row[columnName]
            
            if (isValidUrl(url)) {
                const realUrl = extractRealUrl(url)
                return (
                    <a href={realUrl} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50">
                        🔗 {columnName}
                    </a>
                )
            }
            return <span style={{ color: '#ef4444' }}>🔒 リンクなし</span>
        }
        
        return <span>{value}</span>
    }

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

    const handleLogout = () => {
        sessionStorage.removeItem('yoyaku_session')
        setIsLoggedIn(false)
        setData([])
    }

    const getFilteredData = () => {
        let filtered = [...data]
        
        // Hide past dates (past stays)
        if (hidePastDates) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            filtered = filtered.filter(item => {
                const stayDate = item['宿泊日'] ? new Date(item['宿泊日']) : null
                return stayDate && stayDate >= today
            })
        }
        
        if (filterStatus && filterStatus.length > 0) {
            filtered = filtered.filter(i => filterStatus.includes(i['状態']))
        }
        if (filterHotel) filtered = filtered.filter(i => i['ホテル'] === filterHotel)
        if (filterText) {
            filtered = filtered.filter(i => 
                Object.values(i).some(v => String(v).toLowerCase().includes(filterText.toLowerCase()))
            )
        }
        return filtered
    }

    const filteredData = getFilteredData()
    const totalPages = Math.ceil(filteredData.length / rowsPerPage)
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const hotels = [...new Set(data.map(d => d['ホテル']).filter(Boolean))]
    const statuses = [...new Set(data.map(d => d['状態']).filter(Boolean))]
    
    // Define column order explicitly - "更新日" first, then others
    const COLUMNS_ORDER = ['更新日', '受付番号', '予約者', '宿泊日', 'ホテル', '部屋タイプ', 
                           'キャンセル料発生日', '詳細登録', 'キャンセル', '利用案内書', '状態']
    const columns = data.length > 0 ? 
        Object.keys(data[0]).filter(k => k !== '_id').sort((a, b) => {
            const idxA = COLUMNS_ORDER.indexOf(a)
            const idxB = COLUMNS_ORDER.indexOf(b)
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
        }) : []

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">🏨 Yoyaku Viewer</h1>
                    <p className="text-center text-gray-600 mb-8">予約管理システムへようこそ</p>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ユーザー名</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        {loginError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{loginError}</div>}
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700">ログイン</button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">🏨 Yoyaku Viewer</h1>
                            {apiStatus && <p className="text-xs text-green-600 mt-1">{apiStatus}</p>}
                        </div>
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 sm:px-4 rounded-lg text-sm">ログアウト</button>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">フィルタ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">状態 (複数選択可能)</label>
                            <div className="border border-gray-300 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                                {statuses.map(status => {
                                    const isChecked = filterStatus.includes(status)
                                    return (
                                        <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                            <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFilterStatus([...filterStatus, status])
                                                    } else {
                                                        setFilterStatus(filterStatus.filter(s => s !== status))
                                                    }
                                                    setCurrentPage(1)
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{status}</span>
                                        </label>
                                    )
                                })}
                            </div>
                            {filterStatus.length === 0 && <p className="text-xs text-gray-500 mt-1">全状態を表示中</p>}
                            {filterStatus.length > 0 && <p className="text-xs text-gray-500 mt-1">選択中：{filterStatus.join('、')} ({filterStatus.length}件)</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ホテル</label>
                            <select value={filterHotel} onChange={(e) => { setFilterHotel(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">すべて</option>
                                {hotels.sort().map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">全文検索</label>
                            <input type="text" value={filterText} onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
                                placeholder="キーワード..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                    
                    {/* 過去日のフィルタ */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input 
                                type="checkbox"
                                checked={hidePastDates}
                                onChange={(e) => { setHidePastDates(e.target.checked); setCurrentPage(1); }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">過去分非表示 (宿泊日が過ぎた予約を隠す)</span>
                        </label>
                        {hidePastDates && <p className="text-xs text-gray-500 ml-6 mt-1">未来の宿泊日のみを表示します</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">ロード中...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-[10px] sm:text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {/* 基本情報 - すべての画面で表示 */}
                                            <th key="予約者" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap">予約者</th>
                                            <th key="宿泊日" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap">宿泊日</th>
                                            <th key="ホテル" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap">ホテル</th>
                                            <th key="状態" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap">状態</th>
                                            {/* 操作リンク - スマホでは非表示 */}
                                            <th key="詳細登録" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">詳細</th>
                                            <th key="キャンセル" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">キャンセル</th>
                                            <th key="利用案内書" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">案内書</th>
                                            {/* 追加情報 - タブレット以上 */}
                                            <th key="更新日" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden lg:table-cell">更新日</th>
                                            {/* 詳細情報 - PC デスクトップ */}
                                            <th key="受付番号" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden xl:table-cell">受付番号</th>
                                            <th key="部屋タイプ" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden xl:table-cell">部屋タイプ</th>
                                            <th key="キャンセル料発生日" className="px-2 py-3 text-left text-[9px] font-medium text-gray-500 uppercase whitespace-nowrap hidden xl:table-cell">キャンセル料</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedData.map(row => (
                                            <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                                                {/* 基本情報 - 常に表示 */}
                                                <td className="px-2 py-3 whitespace-nowrap font-medium">{row['予約者'] || '-'}</td>
                                                <td className="px-2 py-3 whitespace-nowrap">{formatDate(row['宿泊日']) || '-'}</td>
                                                <td className="px-2 py-3 whitespace-nowrap">{row['ホテル'] || '-'}</td>
                                                <td className="px-2 py-3 whitespace-nowrap">{renderCell(row['状態'], '状態', row)}</td>
                                                {/* 操作リンク */}
                                                <td className="px-2 py-3 whitespace-nowrap hidden md:table-cell">{renderCell(row['詳細登録'], '詳細登録', row)}</td>
                                                <td className="px-2 py-3 whitespace-nowrap hidden md:table-cell">{renderCell(row['キャンセル'], 'キャンセル', row)}</td>
                                                <td className="px-2 py-3 whitespace-nowrap hidden md:table-cell">{renderCell(row['利用案内書'], '利用案内書', row)}</td>
                                                {/* 追加情報 */}
                                                <td className="px-2 py-3 whitespace-nowrap hidden lg:table-cell">{formatDate(row['更新日']) || '-'}</td>
                                                {/* 詳細情報 */}
                                                <td className="px-2 py-3 whitespace-nowrap hidden xl:table-cell">{row['受付番号'] || '-'}</td>
                                                <td className="px-2 py-3 whitespace-nowrap hidden xl:table-cell">{row['部屋タイプ'] || '-'}</td>
                                                <td className="px-2 py-3 whitespace-nowrap hidden xl:table-cell">{formatDate(row['キャンセル料発生日']) || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {paginatedData.length === 0 && <div className="p-8 text-center text-gray-500">データなし</div>}
                        </>
                    )}
                </div>

                {!loading && filteredData.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                        <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">{filteredData.length}</span>件中{' '}
                            <span className="font-medium">{Math.min((currentPage-1)*rowsPerPage+1, filteredData.length)}</span>-{' '}
                            <span className="font-medium">{Math.min(currentPage*rowsPerPage, filteredData.length)}</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}
                                className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm">前</button>
                            <span className="text-xs sm:text-sm text-gray-600">{currentPage}/{totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}
                                className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm">次</button>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">行数:</label>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm">
                                <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
