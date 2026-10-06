import NewsPostTranslationsPanel from "@/components/admin/NewsPostTranslationsPanel";
import PostForm from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/auth";
import { getNewsCategories } from "@/lib/news-categories-server";
import { getSupabase } from "@/lib/supabase";
import { notFound,redirect } from "next/navigation";
export const revalidate = 0;
export default async function EditPostPage({ params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin();
    }
    catch {
        redirect("/admin/login");
    }
    const supabase = getSupabase();
    const { data: post } = await supabase.from("NewsPost").select("*").eq("id", params.id).maybeSingle();
    if (!post)
        notFound();
    return (<div className="p-6 sm:p-8 w-full space-y-8">
      <PostForm initial={post} categories={await getNewsCategories()}/>
      <div>
        <NewsPostTranslationsPanel postId={post.id} baseTitle={post.title} baseExcerpt={post.excerpt} baseBody={post.body} baseBody2={post.body2} baseVideoUrl={post.videoUrl}/>
      </div>
    </div>);
}
