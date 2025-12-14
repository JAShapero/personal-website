import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HardcoverAuthor {
  name: string;
}

interface HardcoverContribution {
  author: HardcoverAuthor;
}

interface HardcoverBook {
  title: string;
  contributions: HardcoverContribution[];
  image?: string;
  pages?: number;
}

interface HardcoverUserBook {
  book: HardcoverBook;
  progress_pages?: number;
}

// Get Hardcover API token from environment variable
function getHardcoverToken(): string | null {
  return process.env.HARDCOVER_API_TOKEN || null;
}

// Fetch currently reading books from Hardcover using GraphQL
async function fetchCurrentlyReading(apiToken: string): Promise<HardcoverUserBook[]> {
  // First, get the user ID
  const meQuery = `
    query {
      me {
        id
        username
      }
    }
  `;

  const meResponse = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query: meQuery }),
  });

  if (!meResponse.ok) {
    if (meResponse.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`Hardcover API error: ${meResponse.status} ${meResponse.statusText}`);
  }

  const meResult = await meResponse.json();
  
  if (meResult.errors && meResult.errors.length > 0) {
    throw new Error(`GraphQL errors: ${meResult.errors.map((e: any) => e.message).join(', ')}`);
  }

  const userId = meResult.data?.me?.id;
  if (!userId) {
    throw new Error('Could not retrieve user ID from Hardcover API');
  }

  // Now query user_books with reading_status filter
  const query = `
    query {
      user_books(
        where: { 
          user_id: { _eq: "${userId}" },
          reading_status: { _eq: "reading" }
        },
        order_by: { updated_at: desc }
      ) {
        book {
          title
          contributions {
            author {
              name
            }
          }
          image
          pages
        }
        progress_pages
      }
    }
  `;

  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`Hardcover API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    console.error('Hardcover GraphQL errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
  }

  if (!result.data || !result.data.user_books) {
    console.error('Invalid Hardcover API response:', JSON.stringify(result, null, 2));
    throw new Error('Invalid response from Hardcover API');
  }

  // Transform user_books to match our interface
  return result.data.user_books.map((ub: any) => ({
    book: ub.book,
    progress_pages: ub.progress_pages,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiToken = getHardcoverToken();

    if (!apiToken) {
      return res.status(401).json({
        error: 'Hardcover not configured',
        message: 'HARDCOVER_API_TOKEN not set in environment variables.',
      });
    }

    const currentlyReading = await fetchCurrentlyReading(apiToken);

    // Transform the data to match the widget's expected format
    const books = currentlyReading.map((reading, index) => {
      const book = reading.book;
      const authors = book.contributions
        ?.map(contrib => contrib.author?.name)
        .filter(Boolean)
        .join(', ') || 'Unknown Author';
      
      const totalPages = book.pages || 0;
      const currentPage = reading.progress_pages || 0;
      const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

      return {
        id: `book-${index}`,
        title: book.title || 'Untitled',
        author: authors,
        cover_url: book.image || '',
        progress: Math.min(100, Math.max(0, progress)),
        total_pages: totalPages,
        current_page: currentPage,
      };
    });

    return res.status(200).json({ books });
  } catch (error: any) {
    console.error('Hardcover API error:', error);

    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Hardcover API token is invalid or expired. Please check your HARDCOVER_API_TOKEN.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An error occurred while fetching Hardcover data.',
    });
  }
}

