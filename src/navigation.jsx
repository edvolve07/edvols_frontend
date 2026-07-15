export function NavigationProvider({ children }) {
  return children;
}

import {
  Link as RouterLink,
  useLocation,
  useNavigate as useRouterNavigate,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export function usePathname() {
  return useLocation().pathname;
}

export function useNavigate() {
  return useRouterNavigate();
}

export function useSearchParams() {
  const [params] = useRouterSearchParams();
  return params;
}

export function Link({
  href,
  onClick,
  ...props
}) {
  return <RouterLink to={href} onClick={onClick} {...props} />;
}
