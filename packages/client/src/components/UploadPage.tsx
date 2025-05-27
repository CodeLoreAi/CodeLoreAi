
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Github, FolderCode, FileText, ArrowRight } from "lucide-react";

interface UploadPageProps {
  onUploadComplete: (codebaseName: string) => void;
}

const UploadPage = ({ onUploadComplete }: UploadPageProps) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    simulateUpload(file.name);
  };

  const handleGithubSubmit = () => {
    if (!githubUrl.trim()) return;
    
    const repoName = githubUrl.split('/').pop() || 'repository';
    simulateUpload(repoName);
  };

  const simulateUpload = (name: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Analyzing codebase structure...');

    const steps = [
      { progress: 20, status: 'Scanning files and directories...' },
      { progress: 40, status: 'Processing source code...' },
      { progress: 60, status: 'Building dependency graph...' },
      { progress: 80, status: 'Indexing for intelligent search...' },
      { progress: 100, status: 'Upload complete! Ready to chat.' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setUploadProgress(step.progress);
        setUploadStatus(step.status);
        
        if (step.progress === 100) {
          setTimeout(() => {
            onUploadComplete(name);
          }, 1000);
        }
      }, (index + 1) * 1500);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
            <FolderCode className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Codebase</h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Get intelligent answers about your code. Upload your project and start chatting with your codebase.
          </p>
        </div>

        {!isUploading ? (
          <div className="space-y-8">
            {/* Drag & Drop Upload Zone */}
            <Card 
              className={`border-2 border-dashed transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
                  <Upload className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your files here
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload a ZIP file or select a folder containing your project
                </p>
                <input
                  type="file"
                  accept=".zip,.rar,.tar,.gz"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </label>
              </div>
            </Card>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* GitHub URL Input */}
            <Card className="p-8">
              <div className="flex items-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg mr-3">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Connect GitHub Repository</h3>
                  <p className="text-gray-600">Enter a public GitHub repository URL</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleGithubSubmit}
                  disabled={!githubUrl.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Upload Progress */
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 animate-pulse">
                <FolderCode className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Codebase</h3>
              <p className="text-gray-600">{uploadStatus}</p>
            </div>
            
            <div className="space-y-4">
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
