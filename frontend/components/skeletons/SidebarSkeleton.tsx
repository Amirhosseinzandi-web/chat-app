import { Users } from "lucide-react";

const SidebarSkeleton = () => {
    // Create 8 skeleton items
    const skeletonContacts = Array(8).fill(null);

    return (
        <aside
            className="h-full w-full lg:w-80 border-r border-white/10 bg-white/[0.04] 
    flex flex-col transition-all duration-200"
        >
            {/* Header */}
            <div className="border-b border-white/10 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-pearl" />
                    <span className="font-medium text-pearl">Contacts</span>
                </div>
            </div>

            {/* Skeleton Contacts */}
            <div className="overflow-y-auto w-full py-3">
                {skeletonContacts.map((_, idx) => (
                    <div key={idx} className="w-full p-3 flex items-center gap-3">
                        {/* Avatar skeleton */}
                        <div className="relative shrink-0">
                            <div className="skeleton size-12 rounded-full" />
                        </div>

                        {/* User info skeleton - visible on all screen sizes */}
                        <div className="text-left min-w-0 flex-1">
                            <div className="skeleton h-4 w-32 mb-2" />
                            <div className="skeleton h-3 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default SidebarSkeleton;
