import { jest } from '@jest/globals';
import { 
  Collection, 
  MongoClient, 
  Document, 
  ObjectId, 
  InsertOneResult, 
  DeleteResult, 
  UpdateResult, 
  BulkWriteResult,
  FindCursor
} from 'mongodb';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import type { MockedFunction } from 'jest-mock';

// Load environment variables
dotenv.config();

// Set test environment variables if not already set
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Define mock cursor type that properly extends FindCursor
class MockFindCursor<TDocument extends Document = Document> {
  private data: TDocument[];
  private currentSkip: number = 0;
  private currentLimit: number | undefined;
  private currentSort: any;

  constructor(initialData: TDocument[] = []) {
    this.data = initialData;
  }

  sort = jest.fn((sortOptions: any): MockFindCursor<TDocument> => {
    this.currentSort = sortOptions;
    return this;
  }) as MockedFunction<(sortOptions: any) => MockFindCursor<TDocument>>;

  skip = jest.fn((offset: number): MockFindCursor<TDocument> => {
    this.currentSkip = offset;
    return this;
  }) as MockedFunction<(offset: number) => MockFindCursor<TDocument>>;

  limit = jest.fn((limit: number): MockFindCursor<TDocument> => {
    this.currentLimit = limit;
    return this;
  }) as MockedFunction<(limit: number) => MockFindCursor<TDocument>>;

  toArray = jest.fn((): Promise<TDocument[]> => {
    let result = [...this.data];
    
    if (this.currentSort) {
      // Implement sorting logic if needed
    }
    
    if (this.currentSkip) {
      result = result.slice(this.currentSkip);
    }
    
    if (this.currentLimit !== undefined) {
      result = result.slice(0, this.currentLimit);
    }
    
    return Promise.resolve(result);
  }) as MockedFunction<() => Promise<TDocument[]>>;

  setMockData(data: TDocument[]): MockFindCursor<TDocument> {
    this.data = data;
    return this;
  }
}

// Create mock collection with proper types
export const createMockCollection = <TDocument extends Document = Document>() => {
  const mockCursor = new MockFindCursor<TDocument>();

  const mockInsertOne = jest.fn((doc: TDocument): Promise<InsertOneResult<TDocument>> => 
    Promise.resolve({
      acknowledged: true,
      insertedId: new ObjectId()
    })
  );

  const mockFindOne = jest.fn((): Promise<TDocument | null> => 
    Promise.resolve(null)
  );

  const mockDeleteMany = jest.fn((): Promise<DeleteResult> => 
    Promise.resolve({
      acknowledged: true,
      deletedCount: 1
    })
  );

  const mockUpdateOne = jest.fn((): Promise<UpdateResult> => 
    Promise.resolve({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1
    })
  );

  const mockBulkWrite = jest.fn((): Promise<BulkWriteResult> => 
    Promise.resolve({
      ok: 1,
      writeErrors: [],
      writeConcernErrors: [],
      insertedIds: {},
      nInserted: 0,
      nUpserted: 0,
      nMatched: 0,
      nModified: 0,
      nRemoved: 0,
      upserted: []
    })
  );

  const mockCountDocuments = jest.fn((): Promise<number> => 
    Promise.resolve(0)
  );

  const mockFind = jest.fn((): MockFindCursor<TDocument> => mockCursor);

  const collection = {
    insertOne: mockInsertOne,
    find: mockFind,
    findOne: mockFindOne,
    deleteMany: mockDeleteMany,
    updateOne: mockUpdateOne,
    bulkWrite: mockBulkWrite,
    countDocuments: mockCountDocuments
  } as unknown as jest.Mocked<Collection<TDocument>>;

  return {
    collection,
    mockCursor
  };
};

// Create mock Redis client with proper types
export const createMockRedis = () => {
  const mockGet = jest.fn(() => Promise.resolve(null));
  const mockSet = jest.fn(() => Promise.resolve('OK'));
  const mockDel = jest.fn(() => Promise.resolve(1));
  const mockLPush = jest.fn(() => Promise.resolve(1));
  const mockLRange = jest.fn(() => Promise.resolve([]));
  const mockExpire = jest.fn(() => Promise.resolve(1));
  const mockQuit = jest.fn(() => Promise.resolve('OK'));

  return {
    get: mockGet as MockedFunction<typeof mockGet>,
    set: mockSet as MockedFunction<typeof mockSet>,
    del: mockDel as MockedFunction<typeof mockDel>,
    lpush: mockLPush as MockedFunction<typeof mockLPush>,
    lrange: mockLRange as MockedFunction<typeof mockLRange>,
    expire: mockExpire as MockedFunction<typeof mockExpire>,
    quit: mockQuit as MockedFunction<typeof mockQuit>
  } as unknown as jest.Mocked<Redis>;
};

// Global beforeAll hook
beforeAll(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global afterAll hook
afterAll(() => {
  // Clean up any resources
  jest.restoreAllMocks();
});
