// client/src/components/Editor.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

// Check #1: Is this URL exactly correct?
const socket = io.connect("http://localhost:3001");

function Editor() {
  const { documentId } = useParams();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (documentId) {
      // Check #2: Is 'join-document' spelled correctly?
      socket.emit('join-document', documentId);
    }
  }, [documentId]);

  useEffect(() => {
    const handleChange = (newContent) => {
      setContent(newContent);
    };
    // Check #2: Is 'receive-change' spelled correctly?
    socket.on('receive-change', handleChange);

    return () => {
      socket.off('receive-change', handleChange);
    };
  }, []);

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    // Check #2 & #3: Is 'document-change' spelled correctly and is the data object correct?
    socket.emit('document-change', { content: newContent, documentId });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Document: {documentId}</h1>
      <textarea
        value={content}
        onChange={handleTextChange}
        style={{ width: '100%', height: '70vh', fontSize: '16px' }}
      />
    </div>
  );
}

export default Editor;