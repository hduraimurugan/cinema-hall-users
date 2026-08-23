import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { notificationAPI } from "../services/api"

const PAGE_SIZE = 20

const Notifications = () => {
    const [notifications, setNotifications] = useState([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async (targetPage) => {
        setLoading(true)
        try {
            const { notifications: list } = await notificationAPI.list(targetPage, PAGE_SIZE)
            setNotifications(prev => targetPage === 1 ? list : [...prev, ...list])
            setHasMore(list.length === PAGE_SIZE)
            setPage(targetPage)
        } catch {
            // Non-fatal — leave whatever list is already showing.
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load(1) }, [load])

    const handleItemClick = async (notification) => {
        if (notification.read_at) return
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
        try {
            await notificationAPI.markAsRead(notification.id)
        } catch {
            // Non-fatal
        }
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
        try {
            await notificationAPI.markAllRead()
        } catch {
            // Non-fatal
        }
    }

    const unreadCount = notifications.filter(n => !n.read_at).length

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={handleMarkAllRead}>
                        <CheckCheck className="h-4 w-4" /> Mark all read
                    </Button>
                )}
            </div>

            {notifications.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-sm text-muted-foreground">
                    <Bell className="h-6 w-6 mb-2 text-primary" />
                    <p>No notifications yet</p>
                </div>
            ) : (
                <div className="divide-y divide-border/40">
                    {notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            className="flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 rounded-md transition-colors"
                        >
                            <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.read_at ? "bg-primary" : "bg-transparent"}`} aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${!n.read_at ? "font-medium" : "text-muted-foreground"}`}>{n.title}</p>
                                {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" disabled={loading} onClick={() => load(page + 1)}>
                        {loading ? "Loading…" : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default Notifications
