import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogOut } from 'lucide-react';
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEffect, useMemo, useState } from 'react'

function useYjsTldrawStore({
	roomId = 'example',
	hostUrl = 'ws://localhost:1234',
}) {
	const store = useMemo(() => createTLStore({ shapeUtils: defaultShapeUtils }), [])
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		const doc = new Y.Doc()
		const yShapes = doc.getMap('shapes')
		const yBindings = doc.getMap('bindings')

		const provider = new WebsocketProvider(hostUrl, roomId, doc)

		const unsubscribes = []

		let didConnect = false

		provider.on('sync', (isConnected) => {
			if (isConnected && !didConnect) {
				if (yShapes.size === 0) {
					doc.transact(() => {
						for (const [id, shape] of store.shapes.entries()) {
							yShapes.set(id, shape)
						}
						for (const [id, binding] of store.bindings.entries()) {
							yBindings.set(id, binding)
						}
					})
				}

				unsubscribes.push(
					store.listen(
						(changes) => {
							doc.transact(() => {
								changes.forEach((change) => {
									if (change.source !== 'user') return

									switch (change.type) {
										case 'add': {
											if (change.name === 'shape') {
												const shape = store.getShape(change.id)
												yShapes.set(change.id, shape)
											} else if (change.name === 'binding') {
												const binding = store.getBinding(change.id)
												yBindings.set(change.id, binding)
											}
											break
										}
										case 'update': {
											if (change.name === 'shape') {
												const shape = store.getShape(change.id)
												yShapes.set(change.id, shape)
											}
											break
										}
										case 'remove': {
											if (change.name === 'shape') {
												yShapes.delete(change.id)
											} else if (change.name === 'binding') {
												yBindings.delete(change.id)
											}
											break
										}
									}
								})
							})
						},
						{ source: 'user', scope: 'all' }
					)
				)

				yShapes.observeDeep((events) => {
					events.forEach((event) => {
						const newShapes = []
						const updatedShapes = []
						const removedShapes = []

						for (const [id, change] of event.changes.keys) {
							switch (change.action) {
								case 'add': {
									newShapes.push(yShapes.get(id))
									break
								}
								case 'update': {
									updatedShapes.push(yShapes.get(id))
									break
								}
								case 'delete': {
									removedShapes.push(id)
									break
								}
							}
						}

						store.mergeShapes(newShapes, updatedShapes)
						store.removeShapes(removedShapes)
					})
				})

				yBindings.observeDeep((events) => {
					events.forEach((event) => {
						const newBindings = []
						const updatedBindings = []
						const removedBindings = []

						for (const [id, change] of event.changes.keys) {
							switch (change.action) {
								case 'add': {
									newBindings.push(yBindings.get(id))
									break
								}
								case 'update': {
									updatedBindings.push(yBindings.get(id))
									break
								}
								case 'delete': {
									removedBindings.push(id)
									break
								}
							}
						}

						store.mergeBindings(newBindings, updatedBindings)
						store.removeBindings(removedBindings)
					})
				})

				didConnect = true
			}

			setIsReady(isConnected)
		})

		return () => {
			provider.destroy()
			unsubscribes.forEach((fn) => fn())
		}
	}, [hostUrl, roomId, store])

	return { store, isReady }
}


const Whiteboard = () => {
  const { documentId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { store, isReady } = useYjsTldrawStore({
    roomId: documentId,
    hostUrl: 'wss://realtime-canvas-flax.vercel.app',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isReady) {
    return <div>Connecting...</div>
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        store={store}
        identity={{
          id: user?.id ?? 'anonymous',
          name: user?.name ?? 'Anonymous',
        }}
      />
      {/* UI Overlays */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 999, display: 'flex', gap: '10px' }}>
        <Link to="/dashboard" className="p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors" title="Dashboard">
          <Home className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 999 }}>
        <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white shadow-md rounded-md hover:bg-gray-100 transition-colors" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;
