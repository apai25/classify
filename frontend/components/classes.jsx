import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Classes({name, description}) {
  return ( 
    
    <Card className="flex flex-col h-full col-span-1">
    <CardHeader className="pb-3">
      <CardTitle>{name}</CardTitle>
      <CardDescription className="max-w-lg text-balance leading-relaxed">
        {description}
      </CardDescription>
    </CardHeader>
    <div className="flex-grow"></div>  {/* This div will take up all available space */}
    <CardFooter className="mt-auto">
      <Button>View More</Button>
    </CardFooter>
  </Card>
  
  )
}
