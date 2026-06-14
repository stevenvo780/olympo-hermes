import { plainToInstance } from 'class-transformer';
import {
  CategoryExcelRowDto,
  ImportCategoryExcelDto,
} from './import-category-excel.dto';

describe('Category Excel DTO transforms', () => {
  it('transforms numeric fields and parentId null values', () => {
    const row = plainToInstance(CategoryExcelRowDto, {
      id: '10',
      parentId: 'null',
      position: '3',
    });

    expect(row.id).toBe(10);
    expect(row.parentId).toBeNull();
    expect(row.position).toBe(3);
  });

  it('handles invalid numeric values gracefully', () => {
    const row = plainToInstance(CategoryExcelRowDto, {
      id: 'bad',
      parentId: 'bad',
      position: '',
    });

    expect(row.id).toBeUndefined();
    expect(row.parentId).toBeNull();
    expect(row.position).toBeUndefined();
  });

  it('returns undefined for non-numeric position values', () => {
    const row = plainToInstance(CategoryExcelRowDto, {
      position: 'abc',
    });

    expect(row.position).toBeUndefined();
  });

  it('preserves explicit null parentId', () => {
    const row = plainToInstance(CategoryExcelRowDto, {
      parentId: null,
    });

    expect(row.parentId).toBeNull();
  });

  it('handles empty and numeric values for id/parentId/position', () => {
    const row = plainToInstance(CategoryExcelRowDto, {
      id: null,
      parentId: '5',
      position: undefined,
    });

    expect(row.id).toBeUndefined();
    expect(row.parentId).toBe(5);
    expect(row.position).toBeUndefined();
  });

  it('transforms deleteCategoriesNotInExcel values', () => {
    const dtoTrue = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: 'true',
    });
    const dtoOne = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: '1',
    });
    const dtoFalse = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: 'false',
    });
    const dtoZero = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: '0',
    });
    const dtoUndefined = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: '',
    });

    expect(dtoTrue.deleteCategoriesNotInExcel).toBe(true);
    expect(dtoOne.deleteCategoriesNotInExcel).toBe(true);
    expect(dtoFalse.deleteCategoriesNotInExcel).toBe(false);
    expect(dtoZero.deleteCategoriesNotInExcel).toBe(false);
    expect(dtoUndefined.deleteCategoriesNotInExcel).toBeUndefined();
  });

  it('handles boolean and invalid deleteCategoriesNotInExcel values', () => {
    const dtoBoolean = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: true,
    });
    const dtoInvalid = plainToInstance(ImportCategoryExcelDto, {
      rows: [],
      deleteCategoriesNotInExcel: 'maybe',
    });

    expect(dtoBoolean.deleteCategoriesNotInExcel).toBe(true);
    expect(dtoInvalid.deleteCategoriesNotInExcel).toBeUndefined();
  });
});
