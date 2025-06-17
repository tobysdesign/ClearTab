import {
    Card,
    StockCard,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Regular Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Card Title</CardTitle>
                            <CardDescription>Card Description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Card Content</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost">Info</Button>
                            <Button>Action</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Another Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This card has no description or footer.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Card with just a Title</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Stock Cards (Hover Effect)</h2>
                <p className="text-muted-foreground mb-4">
                    Stock cards have subtle borders by default and highlighted borders on hover
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StockCard>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                NASDAQ:TSLA
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                $847.32
                            </CardTitle>
                            <div className="text-sm font-medium text-green-500">
                                +2.4%
                            </div>
                        </CardHeader>
                    </StockCard>

                    <StockCard>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                NYSE:AAPL
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                $178.91
                            </CardTitle>
                            <div className="text-sm font-medium text-red-500">
                                -1.2%
                            </div>
                        </CardHeader>
                    </StockCard>

                    <StockCard>
                        <CardHeader className="pb-3">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                NASDAQ:GOOGL
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                $2,847.32
                            </CardTitle>
                            <div className="text-sm font-medium text-green-500">
                                +0.8%
                            </div>
                        </CardHeader>
                    </StockCard>
                </div>
            </div>
        </div>
    )
} 