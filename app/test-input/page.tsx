export default function TestInputPage() {
  return (
    <div style={{ 
      padding: '2rem', 
      background: '#000', 
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '2rem' }}>Text Input Test</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
          Basic Input:
        </label>
        <input 
          type="text" 
          placeholder="Type here..."
          style={{
            padding: '10px',
            border: '1px solid #333',
            background: '#111',
            color: '#fff',
            borderRadius: '4px',
            width: '300px',
            fontSize: '16px'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
          Basic Textarea:
        </label>
        <textarea 
          placeholder="Type here..."
          rows={4}
          style={{
            padding: '10px',
            border: '1px solid #333',
            background: '#111',
            color: '#fff',
            borderRadius: '4px',
            width: '300px',
            fontSize: '16px',
            resize: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
          With userSelect forced:
        </label>
        <textarea 
          placeholder="Type here..."
          rows={4}
          style={{
            padding: '10px',
            border: '1px solid #333',
            background: '#111',
            color: '#fff',
            borderRadius: '4px',
            width: '300px',
            fontSize: '16px',
            resize: 'none',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text'
          }}
        />
      </div>
    </div>
  )
} 