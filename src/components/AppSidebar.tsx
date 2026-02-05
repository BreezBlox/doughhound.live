import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/auth/AuthContext"

export function AppSidebar() {
    const { user, logout } = useAuth()

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <h2 className="font-orbitron text-primary tracking-[0.2em] text-xs">SECONDBRAIN</h2>
                <h1 className="font-orbitron text-foreground text-xl tracking-widest font-bold">OPS DECK</h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="font-mono text-xs tracking-widest text-muted-foreground mt-4 mb-2">ACTIVE MODULES</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton isActive className="h-auto py-3 flex flex-col items-start gap-1 border-l-2 border-primary bg-sidebar-accent/50">
                                    <span className="font-orbitron text-xs font-bold text-foreground">DOUGH_HOUND_V1</span>
                                    <span className="font-mono text-[10px] text-primary">IN_PROGRESS</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="h-auto py-3 flex flex-col items-start gap-1 opacity-50 hover:opacity-100">
                                    <span className="font-orbitron text-xs font-bold text-muted-foreground">QUIN_WORKFLOW</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">PENDING</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-4">
                {user && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-primary/50" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold truncate text-foreground">{user.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 py-1 px-2 rounded mt-2 font-mono uppercase transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
