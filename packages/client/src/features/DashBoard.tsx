import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const DashBoard: React.FC = () => {
  const [codebases, setCodebases] = React.useState<
    { id: string; name: string; description: string }[]
  >([]);

  React.useEffect(() => {
    console.log("fetching");

    fetch("http://localhost:3000/train/list")
      .then((res) => res.json())
      .then((data) =>
        setCodebases(
          data.repos.map(({ owner, repo }) => ({
            id: `${owner}_${repo}`,
            name: `${owner}/${repo}`,
            description: `${repo} is a repository by ${owner}`,
          }))
        )
      )
      .catch((err) => console.error("Failed to fetch codebases:", err));
  }, []);

  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {codebases.map((codebase) => (
          <div
            onClick={() => navigate(`/chat/${codebase.name}`)}
            key={codebase.id}
            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow hover:cursor-pointer"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{codebase.name}</h2>
              <p className="text-gray-500">{codebase.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center">
        <Button
          onClick={() => navigate("/train")}
          variant="default"
          className="w-full mt-4 transition-all duration-200 hover:tracking-wide"
        >
          <Upload className="w-4 h mr-2" />
          Train New Codebase
        </Button>
      </div>
    </div>
  );
};

export default DashBoard;
