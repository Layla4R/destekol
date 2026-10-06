import PostForm from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/auth";
import { getNewsCategories } from "@/lib/news-categories-server";
import { redirect } from "next/navigation";
export default async function NewPostPage() {
    try {
        await requireAdmin();
    }
    catch {
        redirect("/admin/login");
    }
    return (<div className="p-6 sm:p-8 max-w-3xl">
      <PostForm categories={await getNewsCategories()}/>
    </div>);
}
