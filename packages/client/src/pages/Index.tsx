
import { useState } from 'react';
import UploadPage from '../components/UploadPage';
import ChatPage from '../components/ChatPage';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'upload' | 'chat'>('upload');
  const [uploadedCodebase, setUploadedCodebase] = useState<string | null>(null);

  const handleUploadComplete = (codebaseName: string) => {
    setUploadedCodebase(codebaseName);
    setCurrentPage('chat');
  };

  const handleBackToUpload = () => {
    setCurrentPage('upload');
    setUploadedCodebase(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {currentPage === 'upload' ? (
        <UploadPage onUploadComplete={handleUploadComplete} />
      ) : (
        <ChatPage codebaseName={uploadedCodebase} onBackToUpload={handleBackToUpload} />
      )}
    </div>
  );
};

export default Index;
