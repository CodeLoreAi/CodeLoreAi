import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Github, FolderCode, FileText, ArrowRight } from "lucide-react";
import { UploadZone } from "../components/UploadZone";
import FileUploader from "../components/FileUploader";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const [githubUrl, setGithubUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isUploading) return;

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 95) {
          return Math.min(100, prev + 0.5 + (100 - prev) * 0.05).toPrecision(2);
        }
        clearInterval(interval);
        return prev;
      });
    }, Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isUploading]);

  const handleGithubSubmit = async () => {
    if (!githubUrl.trim()) return;

    const [, username, repository] =
      githubUrl.match(/^https:\/\/github\.com\/([^\/\s]+)\/([^\/\s]+)$/) || [];

    if (!username || !repository) {
      setToastMessage(
        "Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)"
      );
      return;
    } else {
      setToastMessage("");
    }
    await cloneFromGithub(username, repository);
  };

  const cloneFromGithub = async (username: string, repository: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Cloning GitHub repository...");

    const res = await fetch(
      `http://localhost:3000/train/github/${username}/${repository}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      setIsUploading(false);
      setUploadStatus("Failed to clone repository. Please try again.");
      setToastMessage(
        "Failed to clone repository. Please check the URL and try again."
      );
      return;
    }

    if (res.ok) {
      setUploadStatus("Repository cloned successfully!");
      navigate(`/chat/${username}/${repository}`);
      // onUploadComplete(`${username}/${repository}`); ToDo: redirect
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
            <FolderCode className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Codebase
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Get intelligent answers about your code. Upload your project and
            start chatting with your codebase.
          </p>
        </div>

        {!isUploading ? (
          <div className="space-y-8">
            {/* Drag & Drop Upload Zone */}
            {/* <UploadZone
              setIsUploading={setIsUploading}
              setUploadProgress={setUploadProgress}
              setUploadStatus={setUploadStatus}
              setToastMessage={setToastMessage}
            />
            <FileUploader /> */}
            {/* Divider */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div> */}

            {/* GitHub URL Input */}
            <Card className="p-8">
              <div className="flex items-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg mr-3">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Connect GitHub Repository
                  </h3>
                  <p className="text-gray-600">
                    Enter a public GitHub repository URL
                  </p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGithubSubmit();
                }}
                className="flex gap-3"
              >
                <Input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!githubUrl.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        ) : (
          /* Upload Progress */
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 animate-pulse">
                <FolderCode className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Your Codebase
              </h3>
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
        {toastMessage && (
          <div className="mt-4 text-center">
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
              <p className="text-sm">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
