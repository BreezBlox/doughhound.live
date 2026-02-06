import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/auth/AuthContext"
import EntryList from "@/components/EntryList"
import { FinancialEntry } from "@/types"

interface AppSidebarProps {
    entries: FinancialEntry[];
    onDeleteEntry: (id: string) => void;
    onEditEntry: (entry: FinancialEntry) => void;
    editingEntryId?: string;
    onSaveEdit?: (updated: FinancialEntry) => void;
    onCancelEdit?: () => void;
    hiddenIds: string[];
    toggleVisibility: (id: string) => void;
    onShowTutorial: () => void;
}

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton
} from "@/components/ui/sidebar"

export function AppSidebar({ entries, onDeleteEntry, onEditEntry, editingEntryId, onSaveEdit, onCancelEdit, hiddenIds, toggleVisibility, onShowTutorial }: AppSidebarProps) {
    const { user, logout } = useAuth()

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border p-4 bg-ops-bg">
                <h1 className="font-orbitron text-foreground text-xl tracking-widest font-bold">TRANSACTIONS</h1>
            </SidebarHeader>
            <SidebarContent className="bg-ops-bg">
                <div className="p-2 h-full flex flex-col min-h-0">
                    <div className="flex-1 min-h-0 mt-2">
                        <EntryList
                            entries={entries}
                            onDeleteEntry={onDeleteEntry}
                            onEditEntry={onEditEntry}
                            editingEntryId={editingEntryId}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                            hiddenIds={hiddenIds}
                            toggleVisibility={toggleVisibility}
                            compact={true}
                        />
                    </div>
                </div>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-2 bg-ops-bg">
                {user && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-primary/50" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold truncate text-foreground">{user.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                            </div>
                        </div>
                        {user.sheetId && (
                            <div className="text-[9px] font-mono text-ops-dim text-center break-all">
                                ID: {user.sheetId.slice(-6)}
                            </div>
                        )}
                        <button
                            onClick={onShowTutorial}
                            className="w-full text-xs text-ops-accent border border-ops-accent/30 hover:bg-ops-accent/10 py-1 px-2 rounded font-mono uppercase transition-colors"
                        >
                            Tutorial
                        </button>
                        <button
                            onClick={logout}
                            className="w-full text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 py-1 px-2 rounded font-mono uppercase transition-colors"
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
