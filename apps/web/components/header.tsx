"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSNI } from "@/lib/sni";
import { cn } from "@/lib/utils";
import Status from "./status";

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span className={"text-xs"} style={{ fontFamily: "var(--font-geist-mono)" }}>
    {children}
  </span>
);

const getDeviceDisplay = (sniName: string) => {
  switch (sniName) {
    case "fxpakpro":
      return "FX Pak Pro";
    default:
      return "";
  }
};

const ConnectionStatus = () => {
  const data = useSNI("devices", { refreshInterval: 50 });
  const connected = data?.connected;
  if (data.isLoading) {
    return (
      <Button size="xs" variant="ghost">
        <Status label="Connecting" status="pending" />
      </Button>
    );
  }
  if (data.error) {
    return (
      <Button size="xs" variant="ghost">
        <Status label="Error" status="error" />
      </Button>
    );
  }
  if (connected) {
    const deviceDisplay = getDeviceDisplay(data.current.kind);
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="xs" variant="ghost">
            <Status label={deviceDisplay} status="connected" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-120">
          <div className={cn("text-sm")}>
            <p>
              <strong>Device Name</strong>
              <br />
              <Mono>{data.current.displayName}</Mono>
            </p>
            <br />
            <p>
              <strong>URI</strong>
              <br />
              <Mono>{data.current.uri}</Mono>
              <br />
            </p>
            <br />
            <p>
              <strong>Kind</strong>
              <br />
              <Mono>{data.current.kind}</Mono>
              <br />
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  return <Status label="Disconnected" status="disconnected" />;
};

export default function SiteHeader() {
  const LINKS = [
    {
      href: "/",
      label: "Devices",
    },
    {
      href: "/files",
      label: "Files",
    },
  ];
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className={cn("container flex items-center justify-between py-4")}>
        <div className={cn("flex items-baseline")}>
          <Link className={cn("mr-12 font-normal text-md")} href="/">
            SNI Web Client
          </Link>
          <nav
            className={cn("flex items-center space-x-4 font-medium text-sm")}
          >
            {LINKS.map(({ href, label }) => (
              <Link
                className={cn(
                  "border-transparent border-b transition-colors hover:border-primary",
                  usePathname() === href && "border-primary"
                )}
                href={href}
                key={href}
              >
                <div className={cn("px-0.5 pb-1")}>{label}</div>
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <ConnectionStatus />
        </div>
      </div>
    </header>
  );
}
