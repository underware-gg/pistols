import React from 'react'

const Background = ({
  children = null,
  className=null,
}) => {
  return (
    <React.Fragment>
      <div className='AspectLeft'></div>
      <div className='AspectRight'></div>
      <div className='AspectTop'></div>
      <div className='AspectBottom'></div>
      <div className={`AspectContent ${className}`}>
        <div className={`FillParent Relative CenteredContainer`}>
          {children}
        </div>
      </div>
    </React.Fragment>
  );
}

export default Background;
