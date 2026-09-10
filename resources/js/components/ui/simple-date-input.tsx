import { Calendar } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SimpleDateInputProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    placeholder?: string;
}

export function SimpleDateInput({
    date,
    setDate,
    className,
    placeholder = "Select date"
}: SimpleDateInputProps) {
    // Helper to format date as yyyy-MM-dd
    const formatDateForInput = (inputDate: Date): string => {
        const year = inputDate.getFullYear();
        const month = String(inputDate.getMonth() + 1).padStart(2, '0');
        const day = String(inputDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dateString = date ? formatDateForInput(date) : '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value) {
            const newDate = new Date(value);
            if (!Number.isNaN(newDate.getTime())) {
                setDate(newDate);
            }

            return;
        }

        setDate(undefined);
    };

    return (
        <div className={cn("relative flex w-full items-center", className)}>
            <Calendar className="absolute left-3 size-4 text-muted-foreground" />
            <input
                type="date"
                value={dateString}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                )}
            />
        </div>
    );
}
