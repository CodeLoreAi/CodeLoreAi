import { useState } from "react";
import { Card } from "./ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "./ui/button";

export const UploadZone = ({
  setIsUploading,
  setUploadProgress,
  setUploadStatus,
  setToastMessage,
}: {
  setIsUploading: any;
  setUploadProgress: any;
  setUploadStatus: any;
  setToastMessage: any;
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    await handleFileUpload(e.dataTransfer.files);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading codebase...");

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    const res = await fetch("http://localhost:3000/api/train/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setIsUploading(false);
      setUploadStatus("Failed to upload files. Please try again.");
      setToastMessage(
        "Failed to upload files. Please check the console for details."
      );
      return;
    }
    const data = await res.json();

    console.log({ data });

    setIsUploading(false);
    setUploadStatus("Files uploaded successfully!");
    setUploadProgress(100);
    setToastMessage("Files uploaded successfully!");
    // onUploadComplete(data.codebaseName || "Uploaded Codebase"); ToDo: redirect
  };

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
          onChange={(e) => console.log("button clicked")}
          // onChange={async (e) => await handleFileUpload(e.target.files)}
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
  );
};
