'use client'

import { Checkbox } from "@/components/ui/checkbox"

export default function CheckboxPage() {
    return (
        <div className="grid grid-cols-1 gap-6">
            <h1 className="text-2xl font-bold">Checkbox</h1>

            <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Accept terms and conditions
                </label>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="disabled-checked" checked disabled />
                <label
                    htmlFor="disabled-checked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Disabled (Checked)
                </label>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="disabled-unchecked" disabled />
                <label
                    htmlFor="disabled-unchecked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Disabled (Unchecked)
                </label>
            </div>
        </div>
    )
} 