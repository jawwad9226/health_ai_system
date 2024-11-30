import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TestComponent = ({ message = 'Hello Test', onLoad }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        const response = await new Promise(resolve => 
          setTimeout(() => resolve({ data: 'Test Data' }), 100)
        );
        setData(response.data);
        if (onLoad) onLoad(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onLoad]);

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div data-testid="test-component">
      <h1>{message}</h1>
      {data && <p data-testid="data">{data}</p>}
    </div>
  );
};

TestComponent.propTypes = {
  message: PropTypes.string,
  onLoad: PropTypes.func,
};

export default TestComponent;
