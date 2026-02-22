import { Plus } from 'lucide-react'
import { listLocations } from '@/features/locations/actions'
import { CreateLocationDialog } from '@/features/locations/components/create-location-dialog'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export const metadata = {
    title: 'Locais — Quallisy FVS',
}

/**
 * Página de gestão de locais de inspeção.
 * Rota: /[slug]/locations
 */
export default async function LocationsPage() {
    const result = await listLocations()

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Locais de Inspeção</h1>
                    <p className="text-muted-foreground">
                        Pontos físicos dentro das obras onde as inspeções são realizadas
                    </p>
                </div>
                <CreateLocationDialog>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Local
                    </Button>
                </CreateLocationDialog>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhum local cadastrado"
                    description="Crie o primeiro local de inspeção"
                    action={
                        <CreateLocationDialog>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Local
                            </Button>
                        </CreateLocationDialog>
                    }
                />
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Local</TableHead>
                            <TableHead>Obra</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result.data.map((item) => {
                            const loc = 'location' in item ? item.location : item
                            const proj = 'project' in item ? item.project : null
                            return (
                                <TableRow key={loc.id}>
                                    <TableCell className="font-medium">{loc.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {proj ? proj.name : '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {loc.description || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={loc.active ? 'default' : 'secondary'}>
                                            {loc.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}
