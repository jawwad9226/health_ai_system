describe('Test Setup', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should have access to DOM', () => {
    const element = document.createElement('div');
    expect(element).toBeTruthy();
  });

  it('should have access to window', () => {
    expect(window).toBeDefined();
  });

  it('should have mocked localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });

  it('should have mocked fetch', () => {
    expect(global.fetch).toBeDefined();
    expect(typeof global.fetch).toBe('function');
  });
});
