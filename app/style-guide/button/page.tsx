import { Button, buttonVariants } from "@/components/ui/button"

export default function ButtonPage() {
    return (
        <div className="grid grid-cols-1 gap-4">
            <h1 className="text-2xl font-bold">Button Variants</h1>

            <div className="flex gap-4 items-center">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
            </div>

            <h2 className="text-xl font-semibold">With Icons</h2>
            <div className="flex gap-4 items-center">
                <Button>
                    {/* <Icons.chevronLeft className="mr-2 h-4 w-4" /> */}
                    Back
                </Button>
                <Button>
                    Next
                    {/* <Icons.chevronRight className="ml-2 h-4 w-4" /> */}
                </Button>
            </div>

            <h2 className="text-xl font-semibold">Loading State</h2>
            <div className="flex gap-4 items-center">
                <Button disabled>
                    {/* <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> */}
                    Please wait
                </Button>
            </div>

            <h2 className="text-xl font-semibold">As Child</h2>
            <div className="flex gap-4 items-center">
                <Button asChild>
                    <a>Login</a>
                </Button>
            </div>
        </div>
    )
} 