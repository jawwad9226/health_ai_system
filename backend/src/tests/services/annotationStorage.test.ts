import { jest } from '@jest/globals';
import { Collection, InsertOneResult, DeleteResult, ObjectId, Document, MongoClient, FindCursor, Sort } from 'mongodb';
import Redis from 'ioredis';
import AnnotationStorageService from '../../services/annotationStorage';
import { AnnotationData } from '../../validators/annotationValidator';
import { AppConfig } from '../../utils/config';
import type { MockedFunction } from 'jest-mock';

// Define interfaces for mock data
interface Annotation extends AnnotationData {
  _id?: ObjectId;
  metadata: {
    studyId: string;
    patientId: string;
  };
}

// Define mock cursor type that properly extends FindCursor
class MockFindCursor<TDocument extends Document = Document> {
  private cursor: MockFindCursor<TDocument>;
  private data: TDocument[];

  sort: MockedFunction<(sort: Sort) => MockFindCursor<TDocument>>;
  skip: MockedFunction<(offset: number) => MockFindCursor<TDocument>>;
  limit: MockedFunction<(limit: number) => MockFindCursor<TDocument>>;
  toArray: MockedFunction<() => Promise<TDocument[]>>;

  constructor(initialData: TDocument[] = []) {
    this.cursor = this;
    this.data = initialData;
    
    const mockSort = jest.fn((sort: Sort) => this.cursor);
    const mockSkip = jest.fn((offset: number) => this.cursor);
    const mockLimit = jest.fn((limit: number) => this.cursor);
    const mockToArray = jest.fn(() => Promise.resolve(this.data));

    this.sort = mockSort as MockedFunction<typeof mockSort>;
    this.skip = mockSkip as MockedFunction<typeof mockSkip>;
    this.limit = mockLimit as MockedFunction<typeof mockLimit>;
    this.toArray = mockToArray as MockedFunction<typeof mockToArray>;
  }

  // Helper method to update mock data
  setMockData(data: TDocument[]) {
    this.data = data;
    const mockToArray = jest.fn(() => Promise.resolve(this.data));
    this.toArray = mockToArray as MockedFunction<typeof mockToArray>;
    return this;
  }
}

// Create mock collection with proper types
const createMockCollection = () => {
  const mockCursor = new MockFindCursor<Document>();

  const mockInsertOne = jest.fn((doc: Document) => 
    Promise.resolve<InsertOneResult<Document>>({
      acknowledged: true,
      insertedId: new ObjectId()
    })
  );

  const mockFindOne = jest.fn(() => Promise.resolve(null));

  const mockDeleteMany = jest.fn(() => 
    Promise.resolve<DeleteResult>({
      acknowledged: true,
      deletedCount: 1
    })
  );

  const mockBulkWrite = jest.fn(() => Promise.resolve({ ok: 1 }));
  const mockCountDocuments = jest.fn(() => Promise.resolve(0));
  const mockFind = jest.fn(() => mockCursor);

  const collection = {
    insertOne: mockInsertOne as MockedFunction<typeof mockInsertOne>,
    find: mockFind as MockedFunction<typeof mockFind>,
    findOne: mockFindOne as MockedFunction<typeof mockFindOne>,
    deleteMany: mockDeleteMany as MockedFunction<typeof mockDeleteMany>,
    bulkWrite: mockBulkWrite as MockedFunction<typeof mockBulkWrite>,
    countDocuments: mockCountDocuments as MockedFunction<typeof mockCountDocuments>
  };

  const mockCollection = {
    ...collection,
    __setMockData: (data: Document[]) => {
      const cursor = collection.find();
      (cursor as MockFindCursor<Document>).setMockData(data);
      return mockCollection;
    }
  };

  return mockCollection as unknown as jest.Mocked<Collection<Document>> & { 
    __setMockData: (data: Document[]) => typeof mockCollection 
  };
};

// Create mock Redis client with proper types
const createMockRedis = () => {
  const mockIncr = jest.fn(() => Promise.resolve(1));
  const mockSet = jest.fn(() => Promise.resolve('OK'));
  const mockGet = jest.fn(() => Promise.resolve(null));
  const mockDel = jest.fn(() => Promise.resolve(1));
  const mockLrange = jest.fn(() => Promise.resolve([]));
  const mockMulti = jest.fn();

  const redis = {
    incr: mockIncr as MockedFunction<typeof mockIncr>,
    set: mockSet as MockedFunction<typeof mockSet>,
    get: mockGet as MockedFunction<typeof mockGet>,
    del: mockDel as MockedFunction<typeof mockDel>,
    lrange: mockLrange as MockedFunction<typeof mockLrange>,
    multi: mockMulti as MockedFunction<typeof mockMulti>,
    status: 'ready',
    options: {},
    stream: {},
    isCluster: false,
    condition: {}
  } as const;

  return redis as unknown as jest.Mocked<Redis>;
};

describe('AnnotationStorageService', () => {
  let service: AnnotationStorageService;
  let mockCollection: jest.Mocked<Collection<Document>> & { __setMockData: (data: Document[]) => any };
  let mockRedisClient: jest.Mocked<Redis>;
  let mockMongoClient: jest.Mocked<MongoClient>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = createMockCollection();
    mockRedisClient = createMockRedis();

    mockMongoClient = {
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection)
      })
    } as unknown as jest.Mocked<MongoClient>;

    mockConfig = {
      port: 3000,
      environment: 'test',
      database: {
        mongodb: 'mongodb://localhost:27017',
        redis: {
          host: 'localhost',
          port: 6379,
          uri: 'redis://localhost:6379'
        },
        dbName: 'test'
      },
      security: {
        secretKey: 'test',
        jwtSecretKey: 'test',
        jwtSecret: 'test'
      },
      cors: {
        origins: ['http://localhost:3000'],
        origin: 'http://localhost:3000'
      },
      api: {
        title: 'Test API',
        version: '1.0.0'
      },
      mlModels: {
        path: 'test'
      },
      features: {
        enablePerformanceLogging: false,
        enableRateLimiting: false
      },
      logging: {
        level: 'error'
      },
      frontend: {
        url: 'http://localhost:3000'
      }
    };

    service = new AnnotationStorageService(
      mockMongoClient,
      mockRedisClient,
      mockConfig
    );
  });

  describe('saveAnnotations', () => {
    it('should save annotations and cache them', async () => {
      const imageId = '123';
      const userId = 'user1';
      const annotationCoordinates = {
        x: 100,
        y: 100,
        width: 50,
        height: 50
      };
      const annotationItem = {
        type: 'box',
        coordinates: annotationCoordinates
      };
      const annotationData = {
        imageId,
        annotations: [annotationItem],
        layers: [],
        measurements: [],
        labels: [],
        metadata: {
          studyId: 'study1',
          patientId: 'patient1'
        }
      };

      const result = await service.saveAnnotations(imageId, annotationData, userId);

      expect(result).toBeDefined();
      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalled();
    });
  });

  describe('getAnnotations', () => {
    it('should get annotations from cache if available', async () => {
      const imageId = '123';
      const mockAnnotations = [{
        imageId,
        annotations: [],
        layers: [],
        measurements: [],
        labels: [],
        metadata: {
          studyId: 'study1',
          patientId: 'patient1'
        }
      }];

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockAnnotations));

      const result = await service.getAnnotations(imageId);

      expect(result).toEqual(mockAnnotations);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`annotations:${imageId}`);
      expect(mockCollection.find).not.toHaveBeenCalled();
    });
  });

  describe('searchAnnotations', () => {
    it('should search annotations with pagination', async () => {
      const searchOptions = {
        studyId: 'study1',
        patientId: 'patient1',
        page: 1,
        limit: 10
      };

      const mockAnnotations: Annotation[] = [{
        _id: new ObjectId(),
        imageId: '123',
        annotations: [],
        layers: [],
        measurements: [],
        labels: [],
        metadata: {
          studyId: 'study1',
          patientId: 'patient1'
        }
      }];

      mockCollection.__setMockData(mockAnnotations as Document[]);

      const result = await service.searchAnnotations(searchOptions);
      expect(result).toBeDefined();
      expect(result).toEqual(mockAnnotations);
      expect(mockCollection.find).toHaveBeenCalled();
    });
  });

  describe('getAnnotationHistory', () => {
    it('should retrieve annotation history from Redis', async () => {
      const imageId = '123';
      const mockHistory = ['version1', 'version2'];

      mockRedisClient.lrange.mockResolvedValueOnce(mockHistory);

      const result = await service.getAnnotationHistory(imageId);
      expect(result).toEqual(mockHistory);
      expect(mockRedisClient.lrange).toHaveBeenCalledWith(`annotation:history:${imageId}`, 0, -1);
    });
  });

  describe('deleteAnnotations', () => {
    it('should delete annotations for an image', async () => {
      const imageId = '123';
      const deleteResult: DeleteResult = {
        acknowledged: true,
        deletedCount: 1
      };

      mockCollection.deleteMany.mockResolvedValueOnce(deleteResult);

      const result = await service.deleteAnnotations(imageId);
      expect(result).toBe(true);
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ imageId });
    });
  });
});
