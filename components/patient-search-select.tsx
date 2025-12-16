"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface PatientSearchSelectProps {
  patients: Array<{ id: string; name: string; email?: string }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function PatientSearchSelect({
  patients,
  value,
  onValueChange,
  placeholder = "Search patient...",
  required = false,
}: PatientSearchSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedPatient = patients.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          type="button"
        >
          {selectedPatient
            ? `${selectedPatient.name}${selectedPatient.email ? ` (${selectedPatient.email})` : ""}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={`${patient.name} ${patient.email || ""}`}
                  onSelect={() => {
                    onValueChange(patient.id === value ? "" : patient.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{patient.name}</span>
                    {patient.email && (
                      <span className="text-xs text-gray-500">{patient.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

