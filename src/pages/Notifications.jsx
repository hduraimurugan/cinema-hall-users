import React from 'react'
import { User, Settings, Bell } from "lucide-react";

const Notifications = () => {

    const notifications = [];

    return (
        <>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-sm text-muted-foreground">
                        <Bell className="h-6 w-6 mb-2 text-primary" />
                        <p>No notifications yet</p>
                        <p className="text-xs mt-1">We will add notifications in future.</p>
                    </div>
                ) : (
                    notifications.map((notification, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-md transition-colors"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                {notification.icon}
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    )
}

export default Notifications