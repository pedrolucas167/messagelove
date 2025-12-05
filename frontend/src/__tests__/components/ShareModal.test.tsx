import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareModal } from "@/components/letter/ShareModal";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

describe("ShareModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    cardId: "test-card-123",
    cardTitle: "Carta para Maria",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.onClose = jest.fn();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<ShareModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText("Compartilhar Carta")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true", () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText("Compartilhar Carta")).toBeInTheDocument();
    });

    it("should display QR code section", () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByAltText("QR Code")).toBeInTheDocument();
    });

    it("should display share URL input", () => {
      render(<ShareModal {...defaultProps} />);
      
      const input = screen.getByDisplayValue(/\/card\/test-card-123/);
      expect(input).toBeInTheDocument();
    });

    it("should render all share buttons", () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByRole("button", { name: /whatsapp/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /telegram/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /e-mail/i })).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should copy link to clipboard when clicking copy button", async () => {
      render(<ShareModal {...defaultProps} />);
      
      const copyButton = screen.getByRole("button", { name: /copiar/i });
      await userEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("/card/test-card-123")
      );
    });

    it("should show 'Copiado!' after copying", async () => {
      render(<ShareModal {...defaultProps} />);
      
      const copyButton = screen.getByRole("button", { name: /copiar/i });
      await userEvent.click(copyButton);
      
      expect(screen.getByText("Copiado!")).toBeInTheDocument();
    });

    it("should open WhatsApp share when clicking WhatsApp button", async () => {
      render(<ShareModal {...defaultProps} />);
      
      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await userEvent.click(whatsappButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("wa.me"),
        "_blank"
      );
    });

    it("should open Telegram share when clicking Telegram button", async () => {
      render(<ShareModal {...defaultProps} />);
      
      const telegramButton = screen.getByRole("button", { name: /telegram/i });
      await userEvent.click(telegramButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("t.me/share"),
        "_blank"
      );
    });

    it("should open email client when clicking email button", async () => {
      render(<ShareModal {...defaultProps} />);
      
      const emailButton = screen.getByRole("button", { name: /e-mail/i });
      await userEvent.click(emailButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("mailto:"),
        "_blank"
      );
    });
  });

  describe("QR Code", () => {
    it("should generate QR code with correct URL", () => {
      render(<ShareModal {...defaultProps} />);
      
      const qrCode = screen.getByAltText("QR Code") as HTMLImageElement;
      expect(qrCode.src).toContain("api.qrserver.com");
    });

    it("should have download QR code button", () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText(/baixar qr code/i)).toBeInTheDocument();
    });
  });
});
