import { uniqueId } from "lodash";

import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconSettings,
  IconUser,
  IconNotebook,
} from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Apps",
  },
  {
    id: uniqueId(),
    title: "DiningTables",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/apps/dining-tables",
    permission: "dining_table.view",
  },
  {
    id: uniqueId(),
    title: "ProductManagement",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/apps/products",
    permission: "product.view",
  },
  {
    id: uniqueId(),
    title: "TableManagement",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/apps/tables",
    permission: "dining_table.view",
  },
  {
    id: uniqueId(),
    title: "OrderManagement",
    icon: IconNotebook,
    chipColor: "secondary",
    href: "/apps/orders",
    permission: "order.view",
  },
  {
    navlabel: true,
    subheader: "System",
  },
  {
    id: uniqueId(),
    title: "UserManagement",
    icon: IconUserCircle,
    chipColor: "secondary",
    href: "/systems/user-management",
    permission: "user.view",
  },
  {
    id: uniqueId(),
    title: "RoleManagement",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/systems/role-management",
    permission: "role.view",
  },
  {
    id: uniqueId(),
    title: "AuditLog",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/systems/audit-log",
    permission: "audit_log.view",
  },
  {
    id: uniqueId(),
    title: "TenantManagement",
    icon: IconSettings,
    chipColor: "secondary",
    href: "/systems/tenant-management",
    permission: "tenant.view",
    defaultTenantOnly: true,
  },
  {
    navlabel: true,
    subheader: "Account",
  },
  {
    id: uniqueId(),
    title: "Profile",
    icon: IconUser,
    chipColor: "secondary",
    href: "/apps/user-profile/profile",
  },
];

export default Menuitems;
