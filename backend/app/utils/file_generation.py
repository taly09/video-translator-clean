from docx import Document
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
import bidi.algorithm
import arabic_reshaper
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def register_fonts():
    font_dir = Path(__file__).resolve().parent.parent / "assets" / "fonts"

    try:
        pdfmetrics.registerFont(TTFont("NotoSans", str(font_dir / "NotoSans-Regular.ttf")))
        pdfmetrics.registerFont(TTFont("NotoSansHebrew", str(font_dir / "NotoSansHebrew-Regular.ttf")))
        pdfmetrics.registerFont(TTFont("NotoNaskhArabic", str(font_dir / "NotoNaskhArabic-Regular.ttf")))
        print("✅ Fonts registered successfully.")
    except Exception as e:
        logger.error(f"Failed to register fonts: {e}")
        raise

def prepare_rtl_text(text):
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = bidi.algorithm.get_display(reshaped_text)
    return bidi_text

def detect_lang(line):
    for c in line:
        if '\u0590' <= c <= '\u05FF':
            return "he"
        if '\u0600' <= c <= '\u06FF':
            return "ar"
    return "en"

def generate_multilang_pdf(lines_with_lang, output_path):
    register_fonts()

    normal_style = ParagraphStyle(
        'Normal',
        fontName='NotoSans',
        fontSize=14,
        leading=18,
        alignment=TA_LEFT
    )
    he_style = ParagraphStyle(
        'Hebrew',
        fontName='NotoSansHebrew',
        fontSize=14,
        leading=18,
        alignment=TA_RIGHT
    )
    ar_style = ParagraphStyle(
        'Arabic',
        fontName='NotoNaskhArabic',
        fontSize=14,
        leading=18,
        alignment=TA_RIGHT
    )

    pdf = SimpleDocTemplate(output_path, pagesize=A4)
    flowables = []

    print("Starting to build PDF content...")
    for line, lang in lines_with_lang:
        print(f"Line: '{line}' | Language: {lang}")
        if lang == 'he':
            prepared_text = prepare_rtl_text(line)
            style = he_style
        elif lang == 'ar':
            prepared_text = prepare_rtl_text(line)
            style = ar_style
        else:
            prepared_text = line
            style = normal_style

        flowables.append(Paragraph(prepared_text, style))
        flowables.append(Spacer(1, 6))

    pdf.build(flowables)
    logger.info(f"✅ Multilang PDF generated at {output_path}")
    print(f"PDF generated at: {output_path}")

def generate_outputs_from_srt(srt_path, base_name):
    output_dir = Path("results")
    output_dir.mkdir(exist_ok=True)

    try:
        with open(srt_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        logger.exception(f"❌ Failed to read SRT file {srt_path}: {e}")
        raise

    blocks = content.strip().split("\n\n")
    lines = []
    print(f"Total blocks found in SRT: {len(blocks)}")
    for block in blocks:
        parts = block.strip().splitlines()
        if len(parts) >= 3:
            line_text = " ".join(parts[2:])
            lines.append(line_text)
            print(f"Extracted line: '{line_text}'")
        else:
            print(f"Ignored block due to insufficient parts: {parts}")

    # TXT
    try:
        txt_path = output_dir / f"{base_name}.txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        logger.info(f"✅ TXT generated at {txt_path}")
    except Exception as e:
        logger.exception(f"❌ Failed to generate TXT: {e}")
        txt_path = None

    # DOCX
    try:
        docx_path = output_dir / f"{base_name}.docx"
        doc = Document()
        for line in lines:
            doc.add_paragraph(line)
        doc.save(docx_path)
        logger.info(f"✅ DOCX generated at {docx_path}")
    except Exception as e:
        logger.exception(f"❌ Failed to generate DOCX: {e}")
        docx_path = None

    # PDF
    try:
        pdf_path = output_dir / f"{base_name}.pdf"
        lines_with_lang = [(line, detect_lang(line)) for line in lines]
        print("Lines with detected languages:")
        for l, lang in lines_with_lang:
            print(f"'{l}' -> {lang}")
        generate_multilang_pdf(lines_with_lang, str(pdf_path))
    except Exception as e:
        logger.exception(f"❌ Failed to generate Multilang PDF: {e}")
        pdf_path = None

    return str(txt_path) if txt_path else None, \
           str(docx_path) if docx_path else None, \
           str(pdf_path) if pdf_path else None

if __name__ == "__main__":
    srt_example_path = "example.srt"
    base_name_example = "example_output"
    generate_outputs_from_srt(srt_example_path, base_name_example)
