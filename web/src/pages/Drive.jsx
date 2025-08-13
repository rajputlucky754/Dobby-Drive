import React, { useMemo, useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

function useRoot() {
  return useQuery({ queryKey: ['root'], queryFn: async () => (await api.get('/folders/root')).data })
}
function useFolder(id) {
  return useQuery({ enabled: !!id, queryKey: ['folder', id], queryFn: async () => (await api.get(`/folders/${id}`)).data })
}
function useBreadcrumbs(id) {
  return useQuery({ enabled: !!id, queryKey: ['breadcrumbs', id], queryFn: async () => (await api.get(`/folders/breadcrumbs/${id}`)).data })
}

export default function Drive() {
  const [currentId, setCurrentId] = useState(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [shareEmail, setShareEmail] = useState('')
  const qc = useQueryClient()
  const dropRef = useRef(null)

  const { data: root, isLoading: rootLoading } = useRoot()
  const { data: folder, isLoading: folderLoading } = useFolder(currentId)
  const { data: crumbs } = useBreadcrumbs(currentId)

  const listing = useMemo(() => {
    if (currentId && folder) return folder
    if (!currentId && root) return { current: null, folders: root.folders, images: root.images }
    return { current: null, folders: [], images: [] }
  }, [currentId, root, folder])

  async function doSearch(q) {
    setSearch(q)
    if (!q.trim()) return setResults([])
    const { data } = await api.get('/images/search?q=' + encodeURIComponent(q))
    setResults(data)
  }

  const createFolder = useMutation({
    mutationFn: async ({ name }) => (await api.post('/folders', { name, parentId: currentId || undefined })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: currentId ? ['folder', currentId] : ['root'] })
  })

  const uploadImage = useMutation({
    mutationFn: async ({ name, file }) => {
      const fd = new FormData()
      fd.set('name', name)
      if (currentId) fd.set('folderId', currentId)
      fd.set('image', file)
      return (await api.post('/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: currentId ? ['folder', currentId] : ['root'] })
  })

  const deleteFolder = useMutation({
    mutationFn: async (id) => (await api.post(`/folders/delete/${id}`)).data,
    onSuccess: () => {
      if (currentId) {
        // If current is deleted, go up
        setCurrentId(null)
      }
      qc.invalidateQueries({ queryKey: ['root'] })
      if (currentId) qc.invalidateQueries({ queryKey: ['folder', currentId] })
    }
  })

  const deleteImage = useMutation({
    mutationFn: async (id) => (await api.post(`/images/delete/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: currentId ? ['folder', currentId] : ['root'] })
  })

  const shareFolder = useMutation({
    mutationFn: async ({ id, email }) => (await api.post(`/folders/share/${id}`, { email })).data,
    onSuccess: () => setShareEmail('')
  })

  function openFolder(id) { setCurrentId(id) }
  function goHome() { setCurrentId(null) }

  // Drag & Drop
  function onDrop(e) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    files.filter(f => f.type.startsWith('image/')).forEach(file => {
      const name = file.name.replace(/\.[^.]+$/, '')
      uploadImage.mutate({ name, file })
    })
  }
  function onDragOver(e){ e.preventDefault() }

  const loading = rootLoading || folderLoading

  return (
    <div className="container">
      <div className="layout">
        <div className="sidebar">
          <div className="card">
            <button onClick={() => {
              const name = prompt('Folder name')
              if (name) createFolder.mutate({ name })
            }}>+ New Folder</button>
            <hr className="sep"/>
            <input placeholder="Search images..." value={search} onChange={e=>doSearch(e.target.value)}/>
            {results.length > 0 && (
              <div style={{marginTop: 8}} className="col">
                {results.map(img => (
                  <div key={img._id} className="row" style={{justifyContent:'space-between'}}>
                    <span className="muted">{img.name}</span>
                    <a href={img.url.startsWith('http') ? img.url : (import.meta.env.VITE_API_URL + img.url)} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="card" ref={dropRef} onDrop={onDrop} onDragOver={onDragOver}>
            <div className="breadcrumbs">
              <a onClick={goHome} style={{cursor:'pointer'}}>Root</a>
              {crumbs && crumbs.map((c,i)=>(
                <React.Fragment key={c._id}>
                  <span>/</span>
                  <a onClick={()=>setCurrentId(c._id)} style={{cursor:'pointer'}}>{c.name}</a>
                </React.Fragment>
              ))}
            </div>
            <div className="actions">
              <label className="ghost" style={{display:'inline-block'}} title="Drag & drop images anywhere in this panel">
                <input type="file" accept="image/*" style={{display:'none'}} multiple onChange={e=>{
                  const files = Array.from(e.target.files || [])
                  files.forEach(file => {
                    const name = file.name.replace(/\.[^.]+$/, '')
                    uploadImage.mutate({ name, file })
                  })
                  e.target.value = ''
                }}/>
                <span className="btn ghost" style={{padding:'8px 12px', borderRadius:10, border:'1px solid #2a3472'}}>Upload / Drag & Drop</span>
              </label>
              <button className="ghost" onClick={()=>{
                const name = prompt('Folder name')
                if (name) createFolder.mutate({ name })
              }}>New Folder</button>

              {currentId && (
                <>
                  <input placeholder="Share folder by email" value={shareEmail} onChange={e=>setShareEmail(e.target.value)} style={{flex:1}} />
                  <button onClick={()=> shareFolder.mutate({ id: currentId, email: shareEmail })}>Share</button>
                  <button onClick={()=> deleteFolder.mutate(currentId)} style={{background:'#ff6b6b'}}>Delete</button>
                </>
              )}
            </div>
            <hr className="sep"/>
            {loading ? <div>Loading...</div> : (
              <>
                <div className="grid">
                  {listing.folders.map(f => (
                    <div key={f._id} className="folder" onClick={()=>openFolder(f._id)}>
                      📁 {f.name}
                    </div>
                  ))}
                </div>
                <h3 style={{marginTop:16}}>Images</h3>
                <div className="grid images">
                  {listing.images.map(img => (
                    <div key={img._id} className="image">
                      <img src={img.url.startsWith('http') ? img.url : (import.meta.env.VITE_API_URL + img.url)} alt={img.name}/>
                      <div className="meta" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span>{img.name}</span>
                        <button className="ghost" onClick={()=>deleteImage.mutate(img._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {listing.images.length === 0 && <div className="muted">No images here yet.</div>}
                </div>
              </>
            )}
            <div className="muted" style={{marginTop:8}}>Tip: Drag & drop images into this panel to upload.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
