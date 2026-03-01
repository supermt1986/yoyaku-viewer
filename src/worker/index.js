/**
 * Cloudflare Worker - Google Sheets API Proxy
 * This worker acts as a middleware to fetch Google Sheets data with rich text support
 * 
 * Setup required:
 * 1. Create Google Cloud Project
 * 2. Enable Google Sheets API
 * 3. Create OAuth 2.0 credentials
 * 4. Add redirect URI: https://your-worker-name.your-subdomain.workers.dev/oauth/callback
 */

const SHEET_ID = '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8'
const SHEET_TAB_INDEX = 0 // First tab
const LINK_COLUMNS = ['詳細登録', 'キャンセル', '利用案内書']

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle OAuth flow if needed, otherwise fetch sheet data
    if (url.pathname.startsWith('/oauth')) {
      return handleOAuth(request, url, env)
    }
    
    // Fetch sheet data endpoint
    if (url.pathname === '/api/sheet-data') {
      try {
        const token = await getOrRefreshToken(env)
        
        const auth = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          'postmessage'
        )
        
        auth.setCredentials({ access_token: token })
        
        const sheets = await google.sheets({ version: 'v4', auth })
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A:L`, // Adjust range as needed
        })
        
        const dataWithLinks = await enrichWithRichText(response.data.values, sheets, SHEET_ID)
        
        return new Response(JSON.stringify(dataWithLinks), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (error) {
        console.error('Error fetching sheet data:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    }
    
    return new Response('Not Found', { status: 404 })
  }
}

async function handleOAuth(request, url, env) {
  const path = url.pathname
  
  if (path === '/oauth/authorize') {
    const auth = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      'https://' + url.host + '/oauth/callback'
    )
    
    const authorizeUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    
    return Response.redirect(authorizeUrl, 302)
  }
  
  if (path === '/oauth/callback') {
    const code = url.searchParams.get('code')
    const auth = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      'https://' + url.host + '/oauth/callback'
    )
    
    const { tokens } = await auth.getToken(code)
    await saveToken(tokens.access_token, env)
    
    return new Response('Authorization successful! You can close this window.', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

async function getOrRefreshToken(env) {
  const token = await getToken(env)
  
  if (!token) {
    throw new Error('No token available. Please authorize first.')
  }
  
  // Token refresh logic would go here
  // For simplicity, we assume long-lived tokens
  return token
}

async function getToken(env) {
  // Implement KV store or Durable Object for token persistence
  // This is a placeholder
  return env.SHEET_ACCESS_TOKEN
}

async function saveToken(token, env) {
  // Implement token storage
  // This is a placeholder
}

async function enrichWithRichText(values, sheetsClient, spreadsheetId) {
  if (!values || values.length === 0) return []
  
  const headers = values[0]
  const linkColumnIndices = LINK_COLUMNS.map(col => headers.indexOf(col)).filter(i => i !== -1)
  
  if (linkColumnIndices.length === 0) {
    // No link columns found, return plain values
    return { headers, rows: values.slice(1) }
  }
  
  // Get rich text values for link columns
  const batchRequest = {}
  linkColumnIndices.forEach(colIndex => {
    const header = headers[colIndex]
    batchRequest[`A${colIndex + 1}:L1000`] = {
      fields: 'richValues'
    }
  })
  
  const rangeName = `Sheet1!A:L`
  const response = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: rangeName,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
  })
  
  // Parse rich values to extract links
  const enrichedRows = values.slice(1).map((row, rowIndex) => {
    const enrichedRow = {...row}
    
    linkColumnIndices.forEach(colIndex => {
      const cellValue = row[colIndex]
      
      if (cellValue && cellValue.includes('@')) {
        // Try to find corresponding link from rich text
        // Note: Rich text API returns array structure
        const header = headers[colIndex]
        
        // Check if there's a corresponding _URL column
        const urlColumnIndex = headers.findIndex(h => h === `${header}_URL`)
        if (urlColumnIndex !== -1 && row[urlColumnIndex]) {
          enrichedRow[`${header}_url`] = row[urlColumnIndex]
        }
      }
    })
    
    return enrichedRow
  })
  
  return { headers, rows: enrichedRows }
}

// Import Google APIs wrapper for Workers
import { google } from 'https://esm.run/@googleapis/sheets@v8.4.0'
