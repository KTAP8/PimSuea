import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { getNewsById } from "@/services/api";
import type { News } from "@/types/api";

export default function NewsDetails() {
  const { id } = useParams();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getNewsById(id);
        setNews(data);
      } catch (err) {
        console.error("Failed to load news details:", err);
        setError("ไม่สามารถโหลดเนื้อหาข่าวได้");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 space-y-4">
        <AlertCircle className="w-12 h-12" />
        <p className="text-xl font-semibold">{error || "ไม่พบเนื้อหา"}</p>
        <Link to="/">
            <Button variant="outline">กลับไปหน้าหลัก</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปหน้าหลัก
      </Link>

      <article className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Hero Image */}
        <div className="w-full h-64 md:h-96 bg-gray-100 relative">
            {news.image_url ? (
                <img 
                    src={news.image_url} 
                    alt={news.title} 
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">📰</span>
                </div>
            )}
            
            {/* Overlay for Type/Category */}
            {news.type && (
                <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-md">
                        <Tag className="w-3 h-3 mr-1" /> {news.type}
                    </span>
                </div>
            )}
        </div>

        <div className="p-8 space-y-6">
            <header className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                    {news.title}
                </h1>
                
                {news.published_at && (
                    <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        เผยแพร่เมื่อ: {new Date(news.published_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                )}
            </header>

            <hr className="border-gray-100" />

            <div className="prose prose-lg max-w-none text-gray-700">
                {news.content ? (
                     <ReactMarkdown>{news.content}</ReactMarkdown>
                ) : (
                    <p className="text-xl leading-relaxed">{news.description}</p>
                )}
            </div>
        </div>
      </article>
    </div>
  );
}
