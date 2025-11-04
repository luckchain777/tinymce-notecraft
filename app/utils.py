from bs4 import BeautifulSoup
import html2text
import markdown


def extract_plaintext(html_content: str) -> str:
    """
    Extract plaintext from HTML content for search indexing.
    
    Args:
        html_content: HTML string to convert
        
    Returns:
        Cleaned plaintext string
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    plaintext = soup.get_text(separator=' ', strip=True)
    return plaintext


def html_to_markdown(html_content: str) -> str:
    """
    Convert HTML content to Markdown format.
    
    Args:
        html_content: HTML string to convert
        
    Returns:
        Markdown formatted string
    """
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.body_width = 0  # No text wrapping
    markdown_text = h.handle(html_content)
    return markdown_text


def markdown_to_html(markdown_content: str) -> str:
    """
    Convert Markdown content to HTML format.
    
    Args:
        markdown_content: Markdown string to convert
        
    Returns:
        HTML formatted string
    """
    html = markdown.markdown(
        markdown_content,
        extensions=['extra', 'codehilite', 'tables', 'fenced_code']
    )
    return html
