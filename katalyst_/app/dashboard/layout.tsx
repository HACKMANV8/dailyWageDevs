import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaygroundForUser } from "@/modules/dashboard/actions";
import { DashboardSidebar } from "@/modules/dashboard/components/DashBoardSidebar";


export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {

    const playgroundData = await getAllPlaygroundForUser()

    const technologyIconMap : Record<string,string> = {
        REACT:"Zap",
        NEXTJS:"Lightbulb",
        EXPRESS:"Database",
        VUE:"Compass",
        HONO:"FlameIcon",
        ANGULAR:"Terminal"
    }

    const formattedPlaygroundData = playgroundData?.map((item) => ({
        id:item.id,
        name:item.title,
        starred:item.Starmark?.[0]?.isMarked || false,
        icon:technologyIconMap[item.template] || "Code2"
    }))

    return(
        <div className="relative min-h-screen w-full">
            {/* Grid background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-size-[40px_40px]" />
            {/* Radial gradient overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
            
            {/* Main content */}
            <SidebarProvider className="relative z-10 flex min-h-screen w-full overflow-x-hidden">
                {/* Dashboard Sidebar */}
                {/* @ts-ignore-error */}
                <DashboardSidebar initialPlaygroundData={formattedPlaygroundData} />
                <main className="flex-1">
                    {children}
                </main>
            </SidebarProvider>
        </div>
    )

}