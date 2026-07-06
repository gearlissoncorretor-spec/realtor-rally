import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const change = (lng: "pt" | "en") => {
    void i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language.label")}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => change("pt")}
          className={i18n.language.startsWith("pt") ? "font-semibold" : ""}
        >
          🇧🇷 {t("language.pt")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => change("en")}
          className={i18n.language.startsWith("en") ? "font-semibold" : ""}
        >
          🇺🇸 {t("language.en")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
