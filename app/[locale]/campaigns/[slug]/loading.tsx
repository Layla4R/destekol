export default function CampaignDetailLoading() {
    return (<div className="max-w-screen-xl mx-auto px-6 py-16 animate-pulse">
      <div className="h-64 sm:h-96 rounded-2xl bg-line mb-8"/>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-line rounded w-3/4"/>
          <div className="h-4 bg-line rounded w-full"/>
          <div className="h-4 bg-line rounded w-5/6"/>
          <div className="h-4 bg-line rounded w-4/6"/>
        </div>
        <div className="bg-white rounded-xl2 border border-line p-4 space-y-3 h-fit">
          <div className="h-44 bg-line rounded-xl"/>
          <div className="h-10 bg-line rounded-xl"/>
          <div className="h-10 bg-line rounded-xl"/>
        </div>
      </div>
    </div>);
}
