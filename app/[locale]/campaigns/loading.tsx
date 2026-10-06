export default function CampaignsLoading() {
    return (<div className="max-w-screen-xl mx-auto px-6 py-16">
      <div className="h-8 w-48 bg-line rounded-xl mb-8 animate-pulse"/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white rounded-xl2 border border-line overflow-hidden animate-pulse">
            <div className="h-44 bg-line"/>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-line rounded w-3/4"/>
              <div className="h-3 bg-line rounded w-full"/>
              <div className="h-3 bg-line rounded w-2/3"/>
              <div className="h-2 bg-line rounded-full mt-4"/>
              <div className="h-9 bg-line rounded-xl mt-4"/>
            </div>
          </div>))}
      </div>
    </div>);
}
