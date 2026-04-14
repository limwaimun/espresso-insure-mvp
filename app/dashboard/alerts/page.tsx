                        background: '#5AB87A',
                        color: '#120A06',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4CAF50';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#5AB87A';
                      }}
                    >
                      Mark resolved
                    </button>
                  )}
                  
                  {isResolved && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      color: '#5AB87A',
                    }}>
                      <span style={{ fontSize: '14px' }}>✓</span>
                      Resolved
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}