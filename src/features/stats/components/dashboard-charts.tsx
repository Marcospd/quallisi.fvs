'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ChartData {
    pieData: Array<{ name: string; value: number; color: string }>
    barData: Array<{ name: string; total: number; aprovadas: number }>
}

export function DashboardCharts({ pieData, barData }: ChartData) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Pizza — Distribuição de Inspeções */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Distribuição de Inspeções</CardTitle>
                    <CardDescription>Resultado das FVS realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                    {pieData.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value} inspeções`, '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3 shrink-0">
                                {pieData.map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full shrink-0"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Sem dados suficientes
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Gráfico de Barras — Visão Geral */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Visão Geral</CardTitle>
                    <CardDescription>Resumo das atividades do tenant</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                            <Bar dataKey="aprovadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Concluídas" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
