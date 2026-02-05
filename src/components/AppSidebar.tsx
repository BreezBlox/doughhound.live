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
}

import { useState } from "react";
import { LayoutGrid, FileText } from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton
} from "@/components/ui/sidebar"

export function AppSidebar({ entries, onDeleteEntry, onEditEntry, editingEntryId, onSaveEdit, onCancelEdit, hiddenIds, toggleVisibility }: AppSidebarProps) {
    const { user, logout } = useAuth()
    const [viewMode, setViewMode] = useState<'menu' | 'transactions'>('transactions');

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border p-4 bg-ops-bg">
                <h2 className="font-orbitron text-primary tracking-[0.2em] text-xs">SECONDBRAIN</h2>
                <h1 className="font-orbitron text-foreground text-xl tracking-widest font-bold">OPS DECK</h1>
            </SidebarHeader>
            <SidebarContent className="bg-ops-bg">
                {/* Toggle Switch */}
                <div className="p-4 pb-0 flex gap-1">
                    <button
                        onClick={() => setViewMode('menu')}
                        className={`flex-1 py-2 text-[10px] font-mono tracking-widest border border-sidebar-border transition-colors flex items-center justify-center gap-2 ${viewMode === 'menu' ? 'bg-sidebar-accent text-white' : 'text-muted-foreground hover:bg-sidebar-accent/50'}`}
                    >
                        <LayoutGrid size={12} /> MODULES
                    </button>
                    <button
                        onClick={() => setViewMode('transactions')}
                        className={`flex-1 py-2 text-[10px] font-mono tracking-widest border border-sidebar-border transition-colors flex items-center justify-center gap-2 ${viewMode === 'transactions' ? 'bg-sidebar-accent text-white' : 'text-muted-foreground hover:bg-sidebar-accent/50'}`}
                    >
                        <FileText size={12} /> LOG
                    </button>
                </div>

                {viewMode === 'menu' ? (
                    // ORIGINAL MENU VIEW
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
                ) : (
                    // TRANSACTIONS VIEW
                    <div className="p-2 h-full flex flex-col">
                        <div className="mb-2 px-2 mt-4">
                            <h3 className="font-mono text-xs tracking-widest text-muted-foreground">TRANSACTION LOG</h3>
                        </div>
                        <div className="flex-1 overflow-hidden">
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
                )}
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-4 bg-ops-bg">
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
