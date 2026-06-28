export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 w-full">
          <div className="skeleton w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2 w-full pt-1">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="skeleton-text w-full" />
        <div className="skeleton-text w-5/6" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="skeleton h-6 w-16 rounded-md" />
        <div className="skeleton h-6 w-20 rounded-md" />
        <div className="skeleton h-6 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 animate-in mb-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="skeleton w-24 h-24 rounded-full shrink-0" />
        <div className="space-y-4 w-full flex-1">
          <div className="space-y-2">
            <div className="skeleton h-8 w-1/3" />
            <div className="skeleton h-5 w-1/2" />
          </div>
          <div className="flex gap-4">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-5 w-32" />
          </div>
        </div>
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="p-4 border-b border-gray-100 flex gap-4 items-center animate-in">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="skeleton h-4 w-1/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
      <div className="skeleton h-8 w-20 rounded-md" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="p-4"><div className="skeleton h-4 w-32" /></td>
      <td className="p-4"><div className="skeleton h-4 w-24" /></td>
      <td className="p-4"><div className="skeleton h-4 w-16" /></td>
      <td className="p-4"><div className="skeleton h-6 w-16 rounded-full" /></td>
      <td className="p-4"><div className="skeleton h-8 w-8 rounded-md ml-auto" /></td>
    </tr>
  );
}
