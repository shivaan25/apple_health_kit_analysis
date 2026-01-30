"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Upload, FileText, Activity, LogOut, Loader2, BarChart3 } from "lucide-react";

interface Snapshot {
  id: string;
  created_at: string;
  date_range: string;
  metrics: any;
  insights: any;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [days, setDays] = useState("7");
  const [uploading, setUploading] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchSnapshots(session.user.id);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const fetchSnapshots = async (userId: string) => {
    const { data, error } = await supabase
      .from("health_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setSnapshots(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("health_data", file);
    formData.append("days", days);
    formData.append("user_id", user.id);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Analysis Complete!");
        fetchSnapshots(user.id);
        setSelectedSnapshot(data.snapshot);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">FitLife Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Sidebar / Upload Section */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">New Analysis</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Range</label>
                  <select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        {file ? file.name : "Click to upload export.zip"}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".zip" onChange={handleFileChange} />
                  </label>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {uploading ? "Analyzing..." : "Analyze Data"}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">History</h2>
              <div className="space-y-2">
                {snapshots.length === 0 && <p className="text-sm text-gray-500">No snapshots yet.</p>}
                {snapshots.map((snap) => (
                  <button
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`w-full flex items-center p-2 rounded-md text-sm ${selectedSnapshot?.id === snap.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">{new Date(snap.created_at).toLocaleDateString()}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{snap.date_range}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content / Results */}
          <div className="md:col-span-2">
            {selectedSnapshot ? (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Health Analysis</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Based on data from {new Date(selectedSnapshot.created_at).toLocaleDateString()} ({selectedSnapshot.date_range})
                  </p>
                  
                  <div className="prose max-w-none">
                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                      <h3 className="text-lg font-semibold text-blue-900">Overview</h3>
                      <p className="text-blue-800">{selectedSnapshot.insights?.analysis}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border rounded-md p-4">
                        <h3 className="font-semibold text-green-700 mb-2">Fat Loss</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          {selectedSnapshot.insights?.fat_loss?.map((tip: string, i: number) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="border rounded-md p-4">
                        <h3 className="font-semibold text-purple-700 mb-2">Muscle Growth</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          {selectedSnapshot.insights?.muscle_growth?.map((tip: string, i: number) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Raw Metrics</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(selectedSnapshot.metrics as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{key}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {value.avg ? value.avg.toFixed(2) : value.total?.toFixed(2)}
                          <span className="text-xs font-normal text-gray-500 ml-1">{value.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white rounded-lg shadow p-12">
                <BarChart3 className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg">Select a snapshot or upload new data to view insights.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
